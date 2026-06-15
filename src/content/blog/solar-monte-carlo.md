---
title: 'A Thousand Futures: Monte Carlo Risk for a Solar Project'
description: 'Part 3 of 3 — turning a single deterministic IRR into a full probability distribution of returns. A Markov-chain weather model, a kernel-density price model, and a thousand Monte Carlo runs through the project finance model — plus the uncomfortable truth about what really drives a solar plant''s returns.'
pubDate: 'Jun 14 2026'
---

> **Project Finance, in Python** — a three-part series.
> [Part 1 · What a Solar Farm Is Worth](/blog/solar-project-finance-model) ·
> [Part 2 · How Much Sun?](/blog/solar-resource-data) ·
> **Part 3 · A Thousand Futures** (this post)

This is where the series pays off. In [Part 1](/blog/solar-project-finance-model) I built a project finance model for a solar plant that produced a single equity IRR of about 7.7%. In [Part 2](/blog/solar-resource-data) I argued that a single number is a comforting lie — the future isn't one line — and built a dataset describing how sunlight really behaves.

Now I'll connect them. The plan is to learn a *probabilistic* model of the two things that drive the plant's revenue — the weather and the electricity price — simulate **a thousand different 30-year futures**, and run every single one through the project finance model. Out the other end comes not an IRR, but the **distribution** of the IRR: the expected return *and* the shape of the downside. That distribution turns out to tell a very different, and much more honest, story than 7.7%.

<pre class="mermaid">
flowchart LR
  A["1 · Historical data"] --> B["2 · Fit stochastic models"]
  B --> C["3 · Simulate 1,000 futures"]
  C --> D["4 · Project finance model ×1,000"]
  D --> E(["5 · Distribution of IRR"])
</pre>

*Real data → fitted probabilistic models → a thousand simulated futures → a thousand full model solves → one distribution.*

This is **Monte Carlo simulation**: when a system is too tangled to solve with a formula, you don't try — you just play it out thousands of times with realistic random inputs and look at the spread of outcomes. The art is entirely in making the random inputs *realistic*. So before any simulation, two models.

## Modelling the weather: a chain with memory

In Part 2 the daily Clear-Sky Index (CSI) showed two features any honest model has to reproduce: a **skewed shape** (most days near-perfect, a thin tail of bad ones) and **memory** (cloudy days cluster). A model that nailed the shape but ignored the memory would scatter bad days evenly and badly understate the risk of a rotten *month*.

The tool for memory is a **Markov chain**: a system that hops between a handful of states, where tomorrow's state depends only on today's. I bucket the continuous CSI into three weather regimes — **overcast** (CSI 0–0.6), **intermediate** (0.6–0.9) and **clear** (0.9–1.0) — then count, across eleven years, how often each regime is followed by each other. Those counts, normalised, give the **transition matrix** $P$, where $P_{ij}$ is the probability tomorrow lands in regime $j$ given today is in regime $i$:

<pre class="mermaid">
stateDiagram-v2
  Overcast --> Overcast: 35%
  Overcast --> Intermediate: 46%
  Overcast --> Clear: 18%
  Intermediate --> Overcast: 23%
  Intermediate --> Intermediate: 41%
  Intermediate --> Clear: 36%
  Clear --> Overcast: 5%
  Clear --> Intermediate: 17%
  Clear --> Clear: 78%
</pre>

*The fitted chain. Each arrow is a real transition probability counted from 11 years of days.*

The story is in the **self-loops**. A clear day is followed by another clear day **78%** of the time; the chain *wants* to stay where it is. That self-reinforcing tendency is the mathematical fingerprint of weather persistence — exactly the clustering I was worried about losing.

```python
# count consecutive-day transitions, then normalise each row to sum to 1
for today, tomorrow in zip(states[:-1], states[1:]):
    transition_counts[today, tomorrow] += 1
P = transition_counts / transition_counts.sum(axis=1, keepdims=True)
```

The chain gives me *which regime* each day is in, but not the precise CSI value. For that, within each regime I fit a **Beta distribution** — the natural choice for a quantity bounded on `[0, 1]` — to the historical days in that bucket. Simulating a future then has two layers: walk the chain to get a sequence of regimes (with the right persistence), then draw each day's actual CSI from that regime's Beta (with the right shape).

```python
# walk the chain one day at a time
r = np.random.rand()
for next_state, cum_p in enumerate(transition_cum_probs[current_state]):
    if r < cum_p:
        current_state = next_state
        break
# then draw the day's CSI from that state's fitted Beta distribution
csi_today = markov_states[current_state].beta.sample()
```

Does it work? The acid test is to simulate a thousand new histories and check that their CSI distribution matches the real one it was never explicitly told to copy:

<div class="plotly-chart" data-src="/charts/solar-monte-carlo/csi-validation" data-h="440" data-title="Synthetic vs historical Clear-Sky Index"></div>

The synthetic weather (orange outline) sits right on top of the eleven-year history (blue). The model has learned the climate.

## Modelling the price: and an uncomfortable surprise

Revenue is energy *times price*, and the merchant price is its own random beast. Rather than assume a shape for it, I used a **kernel density estimate (KDE)** — a non-parametric method that, in effect, lays a small smooth bump on top of every historical data point and adds them up, letting the data draw its own distribution. I fed it Spanish day-ahead prices, but cleaned deliberately: **only sunny hours** (07:00–17:00, since that's when a solar plant earns), and **only 2024 onward** (to exclude both the 2022 energy-crisis spike and the abnormally low pre-COVID years, neither of which represents the future).

Then I plotted what the plant actually captures — and this is the most important chart in the entire series:

<div class="plotly-chart" data-src="/charts/solar-monte-carlo/price-histogram" data-h="440" data-title="Captured solar-hours electricity price"></div>

In Part 1 I blithely assumed an €80/MWh merchant price. The reality of midday Spanish power is brutal: a **median of about €28/MWh**, a fat spike near zero, and a meaningful number of days where the price goes **negative** — producers paying to offload power.

This is **solar cannibalisation**, and it's the defining economic risk of the technology. Every solar plant in a region produces at the same time — when the sun is up — and floods the midday market with near-zero-marginal-cost electricity. The very abundance that makes the resource attractive crushes the price of selling it. The sun, it turns out, was never the thing to worry about. The price of selling sunshine is.

## A thousand futures, through the model

With both engines built, the simulation is mechanical. Generate 1,000 paths, each a 30-year daily sequence of CSI (Markov + Beta) and price (KDE). For each path, multiply the deterministic clear-sky backbone by the simulated CSI to get actual irradiance, then convert that into the **net equivalent hours** the finance model wants, using two standard PV engineering factors — a **transposition factor** (1.3, the gain from tilting panels toward the sun) and a **performance ratio** (0.8, real-world system losses):

$$
h_{\text{eq}} \approx \frac{\text{GHI}}{1000} \times \underbrace{1.3}_{\text{transposition}} \times \underbrace{0.8}_{\text{performance ratio}}
$$

The only change to the Part 1 model is that two scalar inputs — resource and merchant price — become **arrays**, one value per year, so each simulated future feeds its own weather and prices into the cash-flow waterfall. Then I solve the full circular model a thousand times:

```python
scenarios_inputs = [
    replace(inputs,
            net_equivalent_hours = path_hours[i],   # one stochastic future...
            merchant_price       = path_price[i])   # ...per simulation
    for i in range(1000)
]
scenarios.run_scenarios(scenarios_inputs)   # ~1 minute, 1000 full solves
```

Each of those runs is a complete project finance model — sized debt, sculpted repayments, the circular interest loop, the lot — just like Part 1. A thousand IRRs come out.

## The payoff: a distribution, not a point

<div class="plotly-chart" data-src="/charts/solar-monte-carlo/irr-distribution" data-h="460" data-title="Distribution of equity IRR across 1,000 simulations"></div>

This is what the whole pipeline was built to produce, and it lets me make a statement no single-point model can: *the expected equity IRR is about **5.0%**, almost all outcomes fall between **4.6% and 5.4%**, and the worst 10% of futures come in below roughly **4.85%**.* The centre is the expected return; the left tail is the **quantified downside** — precisely the language a lender or an investment committee needs, instead of a lone optimistic number.

Two findings jump out, and both are the kind of thing the deterministic model could never have told me.

**First: the expected return is well below Part 1's headline — and the sun isn't why.** The simulated site is actually *sunnier* than the Part 1 base case (around 1,800 equivalent hours a year versus 1,500), which on its own should *raise* the IRR. Yet the expected return fell from 7.7% to ~5.0%. The entire gap is the **price**: swapping the fantasy flat €80/MWh for the real ~€28 median capture price guts the merchant revenue. The lesson is bracing — a project's return is hostage to its *weakest* assumption, and a confident-looking deterministic model is dangerous precisely because it hides which assumption that is.

**Second: the distribution is astonishingly *tight*.** A spread of barely ±0.4 percentage points across a thousand futures is far narrower than people expect from "weather risk". Why so calm?

<div class="plotly-chart" data-src="/charts/solar-monte-carlo/irr-scatter" data-h="420" data-title="IRR vs lifetime equivalent hours"></div>

Because of **diversification across time**. A solar plant doesn't live or die by one year — it averages weather over 25 of them. A single cloudy month barely moves a 25-year IRR, and at a consistently sunny site there isn't much year-to-year resource variance to begin with. Annual weather noise, played out over the asset's life, largely **averages away** — the law of large numbers, doing its quiet work. The scatter confirms it: more sun does lift returns (the band slopes up), but the band is thin.

The real conclusion is a shift in *where the risk lives*. For this asset, year-to-year weather is **not** the thing that keeps you up at night — it diversifies out. The dominant risks are the ones this model holds fixed: the structural **price level** (that cannibalisation curve drifting lower as more solar is built), the cost of debt, and the terms of the next PPA. A good risk model doesn't just give you a number with error bars; it tells you *which* uncertainties actually matter — and here it points firmly away from the weather and toward the market.

## What the three numbers taught me

The series walked one project finance model through three levels of honesty. Part 1 said *"the IRR is 7.7%"* — clean, precise, and quietly fictional. Part 2 measured the real world the model was pretending to know. Part 3 replaced the fiction with a thousand data-grounded futures and produced *"the IRR is centred near 5%, it's remarkably stable to weather, and the thing that should actually worry you is the price of midday power."*

That last sentence is worth more than the first, even though it's less comfortable — because it's the difference between a number and an understanding of the risk behind it. Building the machine that gets you there — the cash-flow waterfall, the Markov weather, the Monte Carlo engine — is, to me, where engineering and finance turn out to be the same discipline wearing different clothes.

## Notes, assumptions & further work

**Key assumptions.** Daily CSI modelled as a 3-state Markov chain with a per-state Beta distribution; daily merchant price drawn from a Gaussian KDE fitted to Spanish day-ahead prices (sunny hours, 2024 onward); 1,000 independent simulations over a 30-year horizon; annual GHI converted to equivalent hours with a transposition factor of 1.3 and a performance ratio of 0.8; all other inputs (capex, opex, debt terms, PPA) held at the [Part 1](/blog/solar-project-finance-model) base case.

**Simplifications.** The biggest one: **weather and price are simulated independently**, when in reality they are correlated — solar gluts depress midday prices (the cannibalisation effect is itself resource-driven), and weather affects demand. The price distribution is **stationary** — it does not decline over 30 years as more solar is built, nor follow a forward curve, nor inflate. Daily prices are drawn i.i.d. (no autocorrelation or mean-reversion). Negative prices are clipped but the plant is not modelled as curtailing when prices turn negative. Three weather states is deliberately coarse, and only the resource and price vary across simulations — every other model input is fixed.

**Where it could go further.** Model the **price–resource correlation** and an explicit capture rate; make the price **non-stationary** (a declining solar-capture scenario, or a forward-curve-anchored path); add curtailment and negative-price shutdown logic to the revenue line; stochastic interest rates and inflation; a richer weather model (more states or a continuous autoregressive process); a correlated multi-asset portfolio; and sensitivity of the IRR distribution to the KDE bandwidth and the number of Markov states. The headline caveat stands: the tight distribution reflects *these* assumptions — widen the price model and the spread widens with it.

---

*All three models and notebooks are on [GitHub](https://github.com/zeemarquez/project-finance). This is a personal modelling exercise, not investment advice — assumptions and data cuts are illustrative.*
