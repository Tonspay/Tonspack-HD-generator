import Web3  from "web3";
import * as _Web3  from "web3";
import CryptoJS from 'crypto-js'
import bs58 from "bs58";
import nacl from "tweetnacl";
//EVM
import * as hd from "ethereumjs-wallet";
//SOLANA
import * as solanaWeb3 from "@solana/web3.js";
//TON
import * as tonCrypto from "@ton/crypto";
const keyPairFromSecretKey = tonCrypto.keyPairFromSecretKey;
import * as _ton from "@ton/ton";

const DEFAULT_PASSWORDLENGTH = 8; //The length of encryption number

//To generate a totally new account
const randomAccount = async () => {
  const _w = new Web3();
  return _w.eth.accounts.create();
}
//Recover account from seeds
const seedToAccount = (seed:string) => {
  const _w = new Web3();
  return _w.eth.accounts.privateKeyToAccount(seed);
}
//Base encryption with CBC-Pkcs7
const aesEncrypt = (message:any, key:any) => {
  const iv = CryptoJS.enc.Utf8.parse(key);
  key = CryptoJS.enc.Utf8.parse(key);
  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(message),key, {
      keySize: 128 / 8,
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return bs58.encode(
      Buffer.from(encrypted.toString())
    );
}
//Base decryption with same method
const decryptByDES = (ciphertext:any, key:any) => {
  const iv = CryptoJS.enc.Utf8.parse(key);
  key = CryptoJS.enc.Utf8.parse(key);
  ciphertext=Buffer.from(
    bs58.decode(ciphertext)
  ).toString()
  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    keySize: 128 / 8,
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
});
  return (decrypted.toString(CryptoJS.enc.Utf8));
}
//Create a init link for a random address
const aesCreate = async (msg:any) => {
    const seed = await ranStr(DEFAULT_PASSWORDLENGTH);
    const ret =  await aesEncrypt(
      msg,
      seed
    )
    return {
      "data":ret,
      "key":seed
    }
}

function randomHDKey()
{
  return bs58.encode(
    Uint8Array.from(
      (hd.default.generate()).getPrivateKey()
    )
  )
}

//Random Number String
const ranStr = async (length: number) =>   {
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

//Interface type

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
interface objAddress {
  evm: string;
  sol: string;
  ton: string;
  btc: string;
}

interface objActionRawData {
  t: number;
  i: string;
  d: string;
  c: string;
  r: string | null;
}

/**
 * Transaction Type
 */
interface objTonTxn {
  v: BigInt | number;
  t: string;
  d: string;
}


const evm = {
      randomKey()
      {
        return _Web3.eth.accounts.create();
      },
      
      getKeyPairFromSec(sec:string)
      {
        return _Web3.eth.accounts.privateKeyToAccount(sec)
      },
      
      
      connect(kp: objKP) {
        return kp.evmKp.address;
      },
      
      sign(kp: objKP, data: string) {
        const account = _Web3.eth.accounts.privateKeyToAccount(kp.evmKp.privateKey);
      
        return account.sign(data);
      },
      
      async signAndSendTxn(kp: objKP, data: any ,rpc :string) {
        if (rpc) {
          try {
            const w3 = this.getWeb3(rpc)
            const txns = data.d;
            const gas = w3.utils.toBigInt(21000);
            const gasPrice = await w3.eth.getGasPrice();
            const nonce = await w3.eth.getTransactionCount(kp.evmKp.address);
      
            var transaction = {
              to: txns.t,
              value: 0,
              gas,
              gasPrice,
              nonce,
              chainId: data.c.i,
              data: "",
            };
      
            if (txns.v && txns.v > 0) {
              transaction["value"] = txns.v;
            }
      
            if (txns.d) {
              transaction["data"] = txns.d;
              transaction["gas"] = await w3.eth.estimateGas({
                value: transaction.value,
                to: txns.t,
                data: txns.d,
              });
            }
            if (txns.g && txns.g > 0) {
              transaction.gas = txns.g;
            }
            const signedTx = await w3.eth.accounts.signTransaction(
              transaction,
              kp.evmKp.privateKey,
            );
            const receipt = await w3.eth.sendSignedTransaction(
              signedTx.rawTransaction,
            );
      
            return receipt;
          } catch (e) {
            console.error(e);
      
            return {
              status: false,
              reason: e,
            };
          }
        }
      
        return false;
      },
      
      getWeb3(rpc: string) {
        return new Web3(new Web3.providers.HttpProvider(rpc));
      }
}

const sol = {
  connect(kp: objKP) {
    return kp.solKp.address;
  },
  
  sign(kp: objKP, data: string) {
    const messageBytes = Buffer.from(data);
  
    return {
      address: kp.solKp.address,
      message: data,
      sign: bs58.encode(
        nacl.sign(messageBytes, bs58.decode(kp.solKp.privateKey)),
      ),
    };
  },
  
  async signAndSendTxn(kp: objKP, tx: any, rpc: string) {
    try {
      const rpc_url = rpc;
      const conn = new solanaWeb3.Connection(rpc_url);
      const ret = [];
      let txs;
  
      if (typeof txs == "string") {
        txs = JSON.parse(tx.d);
      } else {
        txs = tx.d;
      }
      for (var u = 0; u < txs.length; u++) {
        const ele = txs[u];
  
        const rawSign = new Uint8Array(bs58.decode(ele.d));
  
        const signer = solanaWeb3.Keypair.fromSecretKey(
          bs58.decode(kp.solKp.privateKey),
        );
  
        if (ele.t && ele.t == 1) {
          //Version transaction
          const realTx = solanaWeb3.VersionedTransaction.deserialize(rawSign);
  
          const simulate = await conn.simulateTransaction(realTx, {
            sigVerify: false,
          });

          // if(!simulate.value.logs)
  
          if (
            simulate &&
            simulate.value &&
            simulate.value.logs &&
            simulate.value.logs
          ) {
            var addFee = true;
  
            simulate.value.logs.forEach((ele) => {
              if (
                ele ==
                "Program ComputeBudget111111111111111111111111111111 success"
              ) {
                addFee = false;
              }
            });
            // if(addFee&&simulate.value&&simulate.value.unitsConsumed)
            // {
            //     const unitsConsumed = simulate.value.unitsConsumed+300;
            //     const unitsPrice = 20000
            //     realTx.add(
            //         web3.ComputeBudgetProgram.setComputeUnitLimit({
            //             units: unitsConsumed
            //         })
            //     )
            //     realTx.add(
            //         web3.ComputeBudgetProgram.setComputeUnitPrice({
            //             microLamports: unitsPrice
            //         })
            //     )
            // }
          }
  
          realTx.sign([signer]);
          const finalSign = realTx.serialize();
  
          ret.push({
            t: 1,
            d: Buffer.from(finalSign).toString("base64"),
          });
        } else {
          const realTx = solanaWeb3.Transaction.populate(solanaWeb3.Message.from(rawSign));
  
          //Transaction
          if (!realTx.recentBlockhash) {
            let blockhashObj = await conn.getRecentBlockhash();
  
            realTx.recentBlockhash = blockhashObj.blockhash;
          }
  
          realTx.sign(signer);
          realTx.partialSign(signer);
          const finalSign = realTx.serialize();
  
  
          ret.push({
            t: 0,
            d: Buffer.from(finalSign).toString("base64"),
          });
        }
      }
  
      return ret;
    } catch (e) {
      console.error(e);
  
      return {
        status: false,
        reason: e,
      };
    }
  }
}

const ton = {
  
getTonWalletV4KeyPair(sec: Buffer, workchain: any) {
  const kp = keyPairFromSecretKey(sec);

  return _ton.WalletContractV4.create({
    publicKey: kp.publicKey,
    workchain: workchain,
  });
},

connect(kp: objKP) {
  return kp.tonKp.address;
},

sign(kp: objKP, data: string) {
  const messageBytes = Buffer.from(data);

  return {
    address: kp.naclKp.publicKey,
    message: data,
    sign: bs58.encode(nacl.sign(messageBytes, kp.naclKp.secretKey)),
  };
},

async signAndSendTxn(kp: objKP, tx: objActionRawData, rpc: string) {
  try {
    const client = new _ton.TonClient({
      endpoint: rpc,
    });

    let keyPair = keyPairFromSecretKey(Buffer.from(kp.naclKp.secretKey));
    let workchain = 0;
    let wallet = _ton.WalletContractV4.create({
      workchain,
      publicKey: keyPair.publicKey,
    });
    let contract = client.open(wallet);
    let seqno = await contract.getSeqno();

    const txn = JSON.parse(tx.d) as objTonTxn[];

    let msg: any[];

    msg = [];

    txn.forEach((e) => {
      msg.push(
        _ton.internal({
          value: (Number(e.v) / Math.pow(10, 9)).toString(),
          to: e.t,
          bounce: false,
          body: e.d,
        }),
      );
    });
    if (msg.length > 0) {
      const ret = await contract.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: msg,
      });

      return 1;
    }

    return 0;
  } catch (e) {
    console.error(e);

    return 1;
  }
}
}

interface initObj {
  sk?:string , //The private keypair
  pwd?:string , //The password
  path?:number , // The HD wallet path
}

interface recoverObj {
  sk:string , //The private keypair
  pwd?:string , //The password
  path?:number , // The HD wallet path
}
 /**
  * HDWallet
  * 
  * - Create new wallet from KP
  * 
  */
export class HDWallet {
  defaultPath = 1;
  keypair: objKP;
  rawKp : string;
  pwd:string;
  path:number;

  //Export the chain action functions
  public chains = {
    evm :evm,
    sol : sol,
    ton : ton
  }
  // New HDwallet auto generate wallets from a random keypair and return data
  public constructor(init?:initObj) {
      let initKp = randomHDKey()
      this.rawKp = initKp;
      this.pwd = ""
      this.path = this.defaultPath;
      if(init)
      {
        
        if(init?.sk)
          {
            this.rawKp = init.sk;
            if(init?.pwd)
              {
                //Password exsit . 
                this.pwd = init.pwd;
              }
          }else{
            if(init?.pwd)
              {
                //Password exsit . 
                this.pwd = init.pwd;
                const kp = aesEncrypt(initKp,init.pwd);
                this.rawKp = kp;
              }
          }
          if(init?.path)
            {
              this.path = init?.path;
            }

      }
      // console.log(init,initKp)
      this.keypair = this.fromPk(this.rawKp,this.path,this.pwd)
      return this;
  }

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

  public static fromPrivateKey(data:recoverObj)
  {
    return new HDWallet(data)
  }
  
}
