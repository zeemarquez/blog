---
title: 'Make your own blockchain'
description: 'A step-by-step guide to programming a blockchain — specifically a cryptocurrency — from scratch in Python, including digital signatures and proof of work.'
pubDate: 'Nov 20 2022'
---

In this post I explain how to program a blockchain, specifically a cryptocurrency, from scratch in Python. I recommend checking out my other [post](/blog/blockchain-what-is-it) that explains how a blockchain works conceptually before diving in here.

## Simple blockchain

Install the `hashlib` library (it's in the standard library since Python 3.6, but the standalone `haslib` package works too):

```bash
pip install hashlib
```

Import the required libraries:

```python
import hashlib as hs
import time
```

### Transactions

We'll start by creating a `Transaction` class. Objects of this type collect the properties of the transactions: the sender, receiver, and value.

```python
class Transaction:
    def __init__(self, sender, receiver, value):
        self.sender = sender
        self.receiver = receiver
        self.value = value
```

### Block

We define a `Block` class that represents each block on the blockchain. Blocks have these attributes:
- `transactions` — the set of transactions
- `timestamp` — when the block was created
- `prevHash` — the hash of the previous block
- `hash` — the hash of this block
- `nonce` — the free variable used for proof of work

`calculateHash()` calculates the block's SHA-256 hash from its attributes.

`mineBlock(difficulty)` executes proof of work by incrementing the `nonce` variable until it finds a hash that starts with the number of zeros specified by the mining difficulty.

```python
class Block:
    def __init__(self, timestamp, transactions):
        self.timestamp = timestamp
        self.transactions = transactions
        self.prevHash = None
        self.hash = None
        self.nonce = 0

    def calculateHash(self):
        data = ''.join([
            self.timestamp,
            ''.join(str(x) for x in self.transactions),
            self.prevHash,
            str(self.nonce)
        ])
        return hs.sha256(data.encode()).hexdigest()

    def mineBlock(self, difficulty):
        target = "0" * difficulty
        while True:
            self.hash = self.calculateHash()
            if self.hash[:difficulty] == target:
                break
            self.nonce += 1
        print("Block mined:", self.hash)
```

### Blockchain

The `Blockchain` class has:
- `difficulty` — the number of leading zeros required in each block hash
- `miningReward` — the reward issued when a block is mined
- `chain` — the list of blocks
- `pendingTransactions` — transactions waiting to be included in the next block

Initializing a `Blockchain` object automatically creates the genesis block.

```python
class Blockchain:

    sysAddress = "0000"  # The address from which the mining reward is sent

    def __init__(self):
        self.difficulty = 2
        self.miningReward = 100
        self.chain = [self.createGenBlock()]
        self.pendingTransactions = []

    def createGenBlock(self):
        genBlock = Block(str(time.time()), [Transaction(Blockchain.sysAddress, 'satoshi', 100)])
        genBlock.prevHash = '0'
        genBlock.hash = genBlock.calculateHash()
        return genBlock

    def getLastBlock(self):
        return self.chain[-1]

    def addBlock(self, newBlock):
        newBlock.prevHash = self.getLastBlock().hash
        newBlock.mineBlock(self.difficulty)
        self.chain.append(newBlock)

    def minePending(self, minerAddress):
        self.pendingTransactions.append(
            Transaction(Blockchain.sysAddress, minerAddress, self.miningReward)
        )
        block = Block(str(time.time()), self.pendingTransactions)
        self.addBlock(block)
        self.pendingTransactions = []

    def stageTransaction(self, transaction):
        if self.isTransactionValid(transaction):
            self.pendingTransactions.append(transaction)
        else:
            print("Transaction invalid")

    def isValid(self):
        for i in range(1, len(self.chain)):
            if self.chain[i-1].hash != self.chain[i].prevHash:
                return False
            if self.chain[i].hash != self.chain[i].calculateHash():
                return False
        return True

    def checkBalance(self, address):
        balance = 0
        for block in self.chain:
            for trans in block.transactions:
                if trans.sender == address:
                    balance -= trans.value
                if trans.receiver == address:
                    balance += trans.value
        return balance

    def isTransactionValid(self, transaction):
        return self.checkBalance(transaction.sender) >= transaction.value
```

### Test

```python
zcoin = Blockchain()

zcoin.minePending('alice')

zcoin.stageTransaction(Transaction('alice', 'bob', 25))

zcoin.minePending('bob')

print('\nBalance Alice:', zcoin.checkBalance('alice'))
print('Balance Bob:', zcoin.checkBalance('bob'))

print('Chain valid:', zcoin.isValid())
```

## Safe Blockchain

The simple blockchain above works but has no security — anyone can forge transactions on behalf of someone else. We need digital signatures to sign each transaction so it can be verified that only the sender can authorize it.

```bash
pip install eciespy
```

```python
from ecies import utils
from ecies import encrypt, decrypt
import ecies

def genKeyPair():
    private_key = utils.generate_key()
    public_key = private_key.public_key
    return (private_key.to_hex(), public_key.format().hex())

def sign(data, signingKey):
    k = utils.generate_key().from_hex(signingKey)
    return k.sign(data.encode())

def verify(data, signature, publicKey):
    try:
        kpub = ecies.hex2pub(publicKey)
    except:
        return False
    return kpub.verify(signature, data.encode())

def getPublicKey(private_key):
    k = utils.generate_key().from_hex(private_key)
    return k.public_key.format().hex()
```

Quick sanity check:

```python
private_key, public_key = genKeyPair()
sig = sign('message', private_key)
print(verify('message', sig, public_key))  # True
```

### Signed transactions

The updated `Transaction` class adds a `signature` attribute and two methods:
- `signTransaction(signKey)` — signs the transaction hash with the sender's private key
- `isValid()` — verifies the signature using the sender's public key

```python
class Transaction:
    def __init__(self, sender, receiver, value):
        self.sender = sender
        self.receiver = receiver
        self.value = value
        self.signature = None

    def calculateHash(self):
        data = ''.join([self.sender, self.receiver, str(self.value)])
        return hs.sha256(data.encode()).hexdigest()

    def signTransaction(self, signKey):
        if getPublicKey(signKey) != self.sender:
            print("You cannot sign transactions for other wallets!")
            return
        hashTx = self.calculateHash()
        self.signature = sign(hashTx, signKey)

    def isValid(self):
        if self.sender == Blockchain.sysAddress:
            return True  # Mining reward transactions don't need a signature
        if self.signature is None:
            return False
        return verify(self.calculateHash(), self.signature, self.sender)
```

The updated `Block` class adds `checkValidTransactions()`:

```python
class Block:
    def __init__(self, timestamp, transactions):
        self.timestamp = timestamp
        self.transactions = transactions
        self.prevHash = None
        self.hash = None
        self.nonce = 0

    def calculateHash(self):
        data = ''.join([self.timestamp, str(self.transactions), self.prevHash, str(self.nonce)])
        return hs.sha256(data.encode()).hexdigest()

    def mineBlock(self, difficulty):
        target = "0" * difficulty
        while True:
            self.hash = self.calculateHash()
            if self.hash[:difficulty] == target:
                break
            self.nonce += 1
        print("Block mined:", self.hash)

    def checkValidTransactions(self):
        return all(tx.isValid() for tx in self.transactions)
```

The updated `Blockchain` class checks transaction validity when adding blocks:

```python
class Blockchain:

    sysAddress = "0000"

    def __init__(self):
        self.difficulty = 2
        self.miningReward = 100
        self.chain = [self.createGenBlock()]
        self.pendingTransactions = []

    def createGenBlock(self):
        genBlock = Block(str(time.time()), [Transaction(Blockchain.sysAddress, 'satoshi', 100)])
        genBlock.prevHash = '0'
        genBlock.hash = genBlock.calculateHash()
        return genBlock

    def getLastBlock(self):
        return self.chain[-1]

    def addBlock(self, newBlock):
        newBlock.prevHash = self.getLastBlock().hash
        newBlock.mineBlock(self.difficulty)
        self.chain.append(newBlock)

    def minePending(self, minerAddress):
        self.pendingTransactions.append(
            Transaction(Blockchain.sysAddress, minerAddress, self.miningReward)
        )
        block = Block(str(time.time()), self.pendingTransactions)
        self.addBlock(block)
        self.pendingTransactions = []

    def stageTransaction(self, transaction):
        if self.isTransactionValid(transaction):
            self.pendingTransactions.append(transaction)
        else:
            raise Exception("Transaction invalid")

    def isValid(self):
        for i in range(1, len(self.chain)):
            if self.chain[i-1].hash != self.chain[i].prevHash:
                return False
            if self.chain[i].hash != self.chain[i].calculateHash():
                return False
            if not self.chain[i].checkValidTransactions():
                return False
        return True

    def checkBalance(self, address):
        balance = 0
        for block in self.chain:
            for trans in block.transactions:
                if trans.sender == address:
                    balance -= trans.value
                if trans.receiver == address:
                    balance += trans.value
        return balance

    def isTransactionValid(self, transaction):
        return self.checkBalance(transaction.sender) >= transaction.value
```

### Test with signatures

```python
myKey, myWalletAddress = genKeyPair()
AliceKey, AliceWalletAddress = genKeyPair()
BobKey, BobWalletAddress = genKeyPair()

# Immediately delete the keys we shouldn't hold
del AliceKey, BobKey

zcoin = Blockchain()
zcoin.minePending(myWalletAddress)
print('My balance:', zcoin.checkBalance(myWalletAddress))  # 100

tx1 = Transaction(myWalletAddress, AliceWalletAddress, 50)
tx2 = Transaction(myWalletAddress, BobWalletAddress, 25)
tx1.signTransaction(myKey)
tx2.signTransaction(myKey)

zcoin.stageTransaction(tx1)
zcoin.stageTransaction(tx2)
zcoin.minePending(AliceWalletAddress)

print('My balance:', zcoin.checkBalance(myWalletAddress))  # 25
print('Chain valid:', zcoin.isValid())  # True
```

## References

- Savjee, *SavjeeCoin* — <https://github.com/Savjee/SavjeeCoin>
