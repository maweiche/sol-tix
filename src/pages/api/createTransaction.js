import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Keypair, clusterApiUrl, Connection, PublicKey, Transaction, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { createTransferCheckedInstruction, getAssociatedTokenAddress, createAssociatedTokenAccount, getMint } from "@solana/spl-token";
import BigNumber from "bignumber.js";

// require("dotenv").config();


// SPL TOKEN ADDRESS
const usdcAddress = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const ataAddress = new PublicKey("9cyEStsrZF7LzqLzbNcuUeuat1NM4eHrBVApvkPBCQk4");

//TEST ADDRESS
const goreAddress = new PublicKey("6wJYjYRtEMVsGXKzTuhLmWt6hfHX8qCa6VXn4E4nGoyj");
//M2 ADDRESS
const secondAddress = "8YB9vvdKu1LbZqf9po8MUtUATbUDLAtNEvZviYgZpygv";

// MERCHANT CUT ADDRESS
// store addy
// const secondAddress = "GJ583UebPiedxYi5zQV4n3H1GkALuYpmb15kP8DDgF3X";

const secondPublicKey = new PublicKey(secondAddress);

const createTransaction = async (req, res) => {

    try {
      const { buyer, orderID } = req.body;
      // console.log("req.body on txn", req.body);
      if (!buyer) {
        res.status(400).json({
          message: "Missing buyer address",
        });
      }
  
      if (!orderID) {
        res.status(400).json({
          message: "Missing order ID",
        });
      }
      const buyerAddy = req.body.buyer;
      const owner = req.body.owner;
      // console.log("TOKEN TYPE IS THIS!!!", tokenType);
      console.log("req.body", req.body);
      const price = req.body.price;
  
      const sellerAddress = owner;
      const sellerPublicKey = new PublicKey(sellerAddress);

   
      const itemPrice = price;
  
      // console.log("TOKEN TYPE IS THIS!!!", tokenType);
  
      const buyerPublicKey = new PublicKey(buyerAddy);
  
      const network = WalletAdapterNetwork.Devnet;
      const endpoint = clusterApiUrl(network);
      const block_connection = new Connection(endpoint, "confirmed");
      const connection = new Connection(
        "https://solana-mainnet.g.alchemy.com/v2/7eej6h6KykaIT45XrxF6VHqVVBeMQ3o7",
        "confirmed"
      );
      const shippingCost = 0;
      
  
      console.log("itemPrice", itemPrice);
      if (!itemPrice) {
        res.status(404).json({
          message: "Item not found. please check item ID",
        });
      }
      const usdcMint = await getMint(connection, usdcAddress);
      const bigAmount = BigNumber(itemPrice);
      //console.log 3.5% of the total price
      //parseFloat to 2 decimals
      const sellerCut = parseInt(((bigAmount.toNumber() * 10 ** (await usdcMint).decimals)));

      const { blockhash } = await block_connection.getLatestBlockhash("finalized");
  
      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: buyerPublicKey,
      });
      
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: buyerPublicKey,
        // Lamports are the smallest unit of SOL, like Gwei with Ethereum
        lamports: (bigAmount.multipliedBy(LAMPORTS_PER_SOL).toNumber()), 
        toPubkey: sellerPublicKey,
        });

        // const transferTwo = SystemProgram.transfer({
        //   fromPubkey: buyerPublicKey,
        //   lamports: (bigAmount.multipliedBy(LAMPORTS_PER_SOL).toNumber() * .2),
        //   toPubkey: secondPublicKey,
        // })


        // console.log("these are the instructions ->", transferInstruction)

        transferInstruction.keys.push({
          pubkey: new PublicKey(orderID),
          isSigner: false,
          isWritable: false,
        });

        // tx.add(transferInstruction, transferTwo);
        tx.add(transferInstruction);
      
      
      const serializedTransaction = tx.serialize({
        requireAllSignatures: false,
      });
  
      const base64 = serializedTransaction.toString("base64");
  
      res.status(200).json({
        transaction: base64,
      });
    } catch (err) {
      console.error("error is",err);
  
      res.status(500).json({ error: "error creating transaction" });
      return;
    }
  };
  
  export default function handler(req, res) {
    if (req.method === "POST") {
      createTransaction(req, res);
    } else {
      
      res.status(405).end();
    }
  }