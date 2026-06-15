---
title: 'What a Solar Farm Is Worth: A Project Finance Model in Python'
description: 'Part 1 of 3 — building a three-statement, cash-flow-waterfall project finance model for a solar plant in Python: sizing the debt to a DSCR, pricing the equity IRR, and stress-testing the returns against the one thing nobody controls — the sun.'
pubDate: 'Jun 02 2026'
---

> **Project Finance, in Python** — a three-part series.
> **Part 1 · What a Solar Farm Is Worth** (this post) ·
> [Part 2 · How Much Sun?](/blog/solar-resource-data) ·
> [Part 3 · A Thousand Futures](/blog/solar-monte-carlo)

A solar farm is a strange kind of business. You spend almost all the money on day one — steel, panels, inverters, a connection to the grid — and then for the next 25 years it quietly sells electricity and pays you back. There are no products to reinvent, no marketing, no inventory. Once it is built, a solar plant is essentially a **financial instrument disguised as infrastructure**: a long, fairly predictable stream of cash flows wrapped around a single physical asset.

That is exactly why it gets financed the way it does. Instead of a company borrowing against its balance sheet, the project is placed inside its own dedicated company — a *special purpose vehicle* (SPV) — and the lenders are repaid **only** from the cash the plant itself generates. This is **project finance**, and the whole discipline comes down to one question: *given how uncertain the future is, how much debt can this asset safely carry, and what return is left over for the people who put up the equity?*

To answer that you build a model. This post walks through one I built in Python for a 10 MW solar plant — not the spreadsheet a bank would stamp, but a clean, transparent version of the same machine. The full code is [on GitHub](https://github.com/zeemarquez/project-finance); here I want to explain *what the model is doing and why*, in plain terms.

## The asset in one paragraph

The plant is 10 MW, costs about **€1.0 million per MW** to build (€10 m all-in), takes a year to construct, and then operates for **25 years**. It sells power two ways: roughly 80% of its output is locked into a fixed-price contract — a **Power Purchase Agreement (PPA)** at €40/MWh for the first 13 years — and the rest is sold at the going **merchant** market price. Panels degrade about 0.5% a year, the site is available 99% of the time, and prices and costs drift up with 2% inflation. These assumptions all live in one place in the code, which is what makes the model easy to stress-test later:

```python
inputs = Inputs(
    installed_capacity   = 10,        # MW
    net_equivalent_hours = 1500,      # the resource — how many full-power hours/year
    capex_per_mwp        = 1000.e3,   # €/MW
    opex_per_year        = 100.e3,    # €/year
    ppa_production       = 0.8,       # 80% of output under contract...
    ppa_price            = 40.0,      # ...at €40/MWh, for 13 years
    merchant_price       = 80.0,      # the rest sold at the market price
    debt_tenor           = relativedelta(years=15),
    debt_dscr            = 1.25,      # the key financing constraint (more below)
    debt_interest_rate   = 0.03,
    tax_rate             = 0.25,
    # ...timeline, degradation, working capital, inflation
)
```

The single most important number there is `net_equivalent_hours` — the *resource*. It is the number of hours per year the plant would need to run at full 10 MW power to produce its actual annual energy. A sunnier site has more equivalent hours. Everything downstream flows from it:

$$
\text{Energy}_{t} = \underbrace{P_{\text{cap}}}_{\text{capacity}} \times \underbrace{h_{\text{eq}}}_{\text{equiv. hours}} \times \underbrace{a}_{\text{availability}} \times \underbrace{(1-d)^{t}}_{\text{degradation}}
$$

Hold that thought — by Part 3, that one input becomes a probability distribution, and the whole project's risk profile falls out of it.

## A spreadsheet, written as code

A project finance model is, at heart, three linked financial statements — the **profit & loss**, the **balance sheet**, and the **cash flow** — projected forward one period at a time. In Excel each line is a row of cells that reference other cells. I wanted the same mental model in Python, so each line item is just a function that can reference other line items at the current or a previous period:

```python
@row(group="Revenues")
def production(self, t):
    return (self.installed_capacity(t) * self.net_equivalent_hours(t)
            * self.availability(t) * self.degradation_factor(t))

@row(group="Revenues")
def ebitda(self, t):
    return self.revenues(t) + self.opex(t)      # opex is stored negative
```

`self.revenues(t)` is exactly like writing `=Revenues!C12` in a spreadsheet — it pulls another row, at period `t`. Revenues flow down into **EBITDA** (earnings before interest, tax, depreciation — the cash the plant throws off from operations), then into EBIT after depreciation, then EBT after the cost of debt, then net income after tax. Standard accounting, one function per row.

## Who gets paid first: the cash waterfall

Here is where project finance gets its name and its discipline. The cash the plant generates does not just pile up — it flows through a strict **waterfall**, and the order matters enormously to the people at each level:

<pre class="mermaid">
flowchart TD
  R["Revenues — PPA + merchant sales"] -->|"− operating costs"| E["EBITDA"]
  E -->|"− tax, capex, Δ working capital"| C["CFADS"]
  C -->|"paid first"| D["Debt service → the bank"]
  C -->|"what is left"| S["Cash to shareholders"]
  S --> DIV(["Dividends — the equity return"])
</pre>

*The cash waterfall: operating cash flows down through the bank before anything reaches equity.*

Operating cash (EBITDA), minus tax, capex and changes in working capital, gives the **Cash Available for Debt Service (CFADS)** — the money on the table to deal with the financing. The bank is **first in line**: it takes its interest and principal. Only what survives that flows down to the equity investors as **dividends**. Debt is safer because it is paid first; equity is riskier because it is paid last — and is rewarded accordingly.

## Sizing the debt: the DSCR

So how much can the project borrow? Not "80% of the cost because that's normal" — that is corporate-loan thinking. In project finance the loan is sized off the **cash flow itself**, using the **Debt Service Coverage Ratio (DSCR)**:

$$
\text{DSCR} = \frac{\text{CFADS}}{\text{Debt Service}}
$$

A DSCR of 1.0 means the plant generates *exactly* enough to pay the bank, with nothing to spare — terrifying for a lender. Lenders insist on a cushion. Here the target is **1.25×**, meaning every year the cash flow must cover debt service 1.25 times over. Rearranged, that *defines* how much debt service the project can carry each year:

$$
\text{Debt Service}_{t} = \frac{\text{CFADS}_{t}}{1.25}
$$

Because CFADS rises and falls year to year (sunnier years, inflation, the PPA rolling off), the debt repayment schedule is **sculpted** to follow it — bigger repayments in fat years, smaller in lean ones — always keeping that 1.25× cushion intact. The total loan is simply the sum of repayments the cash flow can support; equity funds whatever is left.

<div class="plotly-chart" data-src="/charts/solar-project-finance-model/dscr-sculpting" data-h="440" data-title="Debt sculpted to a 1.25x DSCR"></div>

```python
@row()
def debt_service(self, t):
    # the cash flow can support service up to CFADS / DSCR
    return self.tenor_debt_flag(t) * self.cf_to_debt_service(t) / self.inputs.debt_dscr
```

There is a subtlety that makes this kind of model interesting to build: it is **circular**. The interest you owe depends on the size of the loan; the size of the loan is sculpted from the cash flow; the cash flow is reduced by the interest you owe. In Excel you tick the "enable iterative calculation" box and it spins until the numbers settle. The Python model does the same thing — it re-evaluates the whole web of formulas repeatedly until the values stop moving:

```python
model = PVModel(periods=26, inputs=inputs,
                enable_iterative_calculation=True,  # solve the circular debt/interest loop
                max_iterations=100, damping=1.0)
model.calculate()
```

## The model, solved

Run it and you get the full three-statement model — one construction year plus 25 operating years across 26 columns, every line item from revenue down to the dividend paid each year. This is the actual styled output of `model.show()` straight from the notebook; hit **expand** to open it full-screen and scroll through all 26 years.

<div class="model-embed" data-src="/charts/solar-project-finance-model/model.html" data-h="420" data-title="Full three-statement project finance model"></div>

*P&amp;L, balance sheet (with a per-period `assets = liabilities` check) and the cash-flow waterfall, all solved together. The circular debt/interest loop is resolved by iteration — exactly as Excel does it.*

## The number the equity investor cares about: IRR

Once the model solves, you have the equity cash flows: capital paid *in* during construction, dividends received *out* over 25 years. The headline metric is the **Internal Rate of Return (IRR)** — the single annual return that makes those cash flows net to zero in today's money. It is the discount rate $r$ that solves:

$$
\sum_{t=0}^{T} \frac{\text{Equity Cash Flow}_{t}}{(1+r)^{t}} = 0
$$

In code, once you have the dividend and capital streams, it is one line:

```python
def output_irr(model):
    returns = (-model.get_result_data('dividends')      # cash in to equity
               - model.get_result_data('capital_increase'))  # cash out from equity
    return float(npf.irr(returns))
```

For the base case — 1,500 equivalent hours, an €80 merchant price — the model returns an equity IRR of about **7.7%**. On its own that number is meaningless. The interesting question is how fragile it is.

## The one input nobody controls

Every assumption in the model is something a developer negotiates, engineers, or contracts for — except one. You cannot negotiate with the sun. So the natural stress test is: *how do returns move as the resource moves?* I swept `net_equivalent_hours` across a realistic range — a cloudier northern site near 900 hours up to a baking-hot southern one near 2,000 — and re-solved the whole model at each point. Changing one assumption everywhere is trivial when they all live in one dataclass:

```python
scenarios = [replace(inputs, net_equivalent_hours=h)
             for h in np.linspace(900, 2000, 100)]
```

The result is the signature of every infrastructure project: **operating leverage**.

<div class="plotly-chart" data-src="/charts/solar-project-finance-model/sensitivity" data-h="440" data-title="Equity IRR vs. the solar resource"></div>

Look at how steep that curve is. At 900 hours the equity barely clears **2.4%** — you'd have been better off in a savings account. At the 1,500-hour base case it's **7.7%**. By 2,000 hours it's **17.3%**. A third more sunshine doesn't give you a third more return; it **more than doubles** it.

The reason is the fixed cost base. The capex is sunk and the debt service is contractually fixed regardless of the weather. So revenue scales with the resource, but a large slab of costs does not — and everything above that slab drops straight to the equity. It's the same mechanism that makes airlines and hotels swing so violently with demand: high fixed costs turn a modest change in the top line into a dramatic change at the bottom. For a solar plant, the "demand" is sunlight.

## Why one number isn't an answer

This deterministic model is genuinely useful — it sizes the debt, prices the equity, and tells you the project's sensitivities. But it has a quiet, dangerous flaw: **it pretends the future is a single line.** It assumes the plant gets *exactly* 1,500 hours every year and sells merchant power at *exactly* €80/MWh, forever.

Reality is not a line. Some years are cloudy. Electricity prices are volatile — and, as we'll see, midday solar prices in Spain have been doing something genuinely alarming. The honest version of the question isn't "what is the IRR?" but "what is the **distribution** of the IRR, and how much of it lives in the danger zone below my hurdle rate?"

Answering that properly means feeding the model thousands of plausible futures instead of one. But you can't invent plausible futures out of thin air — you have to learn them from real data. That is where the next post goes: turning eleven years of satellite weather records and Spanish electricity prices into the raw material for a stochastic model.

→ **Continue to [Part 2 · How Much Sun? Building the Dataset Behind the Model](/blog/solar-resource-data)**

## Notes, assumptions & further work

**Key assumptions.** 10 MW plant; €1.0 m/MWp capex (€10 m); €100 k/year opex; 1,500 net equivalent hours (base case); 99% availability; 0.5%/year degradation; 80% of output under a €40/MWh PPA for 13 years, the remainder merchant at a flat €80/MWh; 2% inflation indexation; 15-year senior debt at 3%, sized to a 1.25× DSCR (capped at 80% of capex); 25% corporate tax; annual time grid (1 construction year + 25 operating years).

**Simplifications.** The model runs on **annual** periods, so debt-service and interest timing are approximate (a bankable model uses semi-annual or quarterly periods). Depreciation is straight-line; there is no **debt service reserve account (DSRA)**, cash sweep, or refinancing; no construction-period interest (IDC); no terminal value or decommissioning cost; merchant revenue uses a single flat price with no capture-rate or price curve; working capital and tax are treated simply (no loss carry-forwards, VAT, or DSRA funding). The resource and price are single deterministic points.

**Where it could go further.** Move to quarterly periods; add a DSRA, cash sweep and a debt tail; test sensitivity to leverage, tenor and interest rate; introduce P50/P90 resource bands and a merchant price curve; add terminal value and decommissioning. The two biggest gaps — a single resource number and a flat merchant price — are exactly what [Part 2](/blog/solar-resource-data) and [Part 3](/blog/solar-monte-carlo) address with real data and Monte Carlo simulation.

---

*The full model, scenario sweep and notebooks are on [GitHub](https://github.com/zeemarquez/project-finance). This is a personal modelling exercise, not investment advice — the assumptions are illustrative.*
