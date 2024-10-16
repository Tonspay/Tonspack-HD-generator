# Tonspack HD generator

This repo is the wallet generator base on BIP44 & HD-wallet of Tonspack wallet . 

Allows user to generate keypair to different chain stander from a sigle EVM-privateKey .

## Chains support 

Currently Tonspack HD wallet sdk **support** follow chains 

- EVM

- TON

- SOLANA

Now working on chains support **TODO** :

- TRON

- BTC

- SUI

- APTOS

- COSMOS

## How to use this SDK ? 

Tonsprotocol/HDwallet SDK support many actions including 

- Generate new wallet

- Generate keypairs for different chains stander

- Sign message in different stander 

- Sign and get the signed transaction (Limited chains)

#### Generate the keypair

You can create a wallet by `new` it .

```ts
import { HDWallet } from "@tonsprotocol/hdwallet";

new HDWallet()
```

Or you can add password

```ts
import { HDWallet } from "@tonsprotocol/hdwallet";

new HDWallet(
  {
    pwd:"helloworld", // Optional
    path:123, //Optional . default 1 
  }
)
```

#### Get the keypairs

You will got the Keypair for the support chains :

```ts
interface objKP {
  naclKp: {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  };
  evmKp: {
    address: string;
    privateKey: string;
  };
  solKp: {
    address: string;
    privateKey: string;
  };
  tonKp: any;
}
```

#### Recover from master keypair

You can recover your keypair with path/password via :

```ts
HDWallet.fromPrivateKey(
  {
        sk:"2Lte2V623NW7pafsAbpzGTQQ8y6Kbnzwop39RyybkPFessboN92d2pUfZi4Xi8KkFccqmC1zyRZ6wfRY2EKgqDu6",
        pwd:"1234",
        path:16
  }
)
```
or
```ts
HDWallet.fromPrivateKey(
  {
        sk:"2dnv6i5vLQFRFFQKpyVhxvijQHE7orgReQJVJ12PboKw",
  }
)
```

## How it works ?

You can check the source code for details . 

The core is base on BIP-44 (will add BIP-39 soon)

```ts
  private fromPk(sec:string,path:number,pwd?:string) {
    let rawKey : Buffer;
    if(pwd)
    {
      rawKey = Buffer.from(bs58.decode(
        decryptByDES(sec,pwd)
      ))
    }else{
      rawKey = Buffer.from(
        bs58.decode(sec)
      );
    }
    const master = hd.hdkey.fromMasterSeed(
      Buffer.from(
        bs58.decode(sec))
      )
      ;
    const derive = master.deriveChild(path);
    const evmWallet = derive.getWallet();
    const naclKp = nacl.sign.keyPair.fromSeed(
      Uint8Array.from(evmWallet.getPrivateKey())
    );


    return {
      naclKp: naclKp,
      evmKp: {
        address: evmWallet.getAddressString(),
        privateKey: evmWallet.getPrivateKeyString(),
      },
      solKp: {
        address: bs58.encode(naclKp.publicKey),
        privateKey: bs58.encode(naclKp.secretKey),
      },
      tonKp: ton.getTonWalletV4KeyPair(Buffer.from(naclKp.secretKey), 0),
    } as objKP;
  }
```