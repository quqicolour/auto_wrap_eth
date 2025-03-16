const { ethers } = require("ethers");
const WAVAXABI = require("./contract_json/WAVAX.json");
require("dotenv").config({ path: ".env" });

const WAVAXAddress = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";

//设置时间多久重复执行
// 定时器间隔（单位：毫秒）
const interval = 60000; //30 s

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_KEY);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const WAVAX = new ethers.Contract(WAVAXAddress, WAVAXABI, signer);

async function getNonce(userAddress) {
    const nonce = await provider.getTransactionCount(userAddress);
    console.log("当前钱包的 nonce 值为：", nonce);
  }

async function Cooking() {
  const currentAddress = await signer.getAddress();
  console.log("currentAddress:", currentAddress);
  const currentBalance = await provider.getBalance(currentAddress);
  console.log("balance:", ethers.utils.formatEther(currentBalance));

  //80%
  const warpAmount = ethers.utils.formatEther(currentBalance) * 0.5;
  const warpAmountString = warpAmount.toString();
  console.log("交易数量:", warpAmountString);
  await getNonce(currentAddress);
  //执行WAVAX存入
  await deposit(warpAmountString);
  await getNonce(currentAddress);
  const thisBalance = await WAVAX.balanceOf(currentAddress);
  console.log("提取的WAVAX数量", ethers.utils.formatEther(thisBalance));
  //执行AVAX提取
  await withdraw(thisBalance);
  await getNonce(currentAddress);
}

async function deposit(tokenAmount) {
  const depositAVAX = await WAVAX.deposit({
    value: ethers.utils.parseEther(tokenAmount),
  });
  const depositAVAXTx = await depositAVAX.wait();
  if (depositAVAXTx.status === 1) {
    console.log("存入成功:", depositAVAXTx.transactionHash);
  } else {
    console.log("存入失败");
  }
}

async function withdraw(tokenAmount) {
  const withdraWAVAX = await WAVAX.withdraw(tokenAmount);
  const withdraWAVAXTx = await withdraWAVAX.wait();
  if (withdraWAVAXTx.status === 1) {
    console.log("提取成功:", withdraWAVAXTx.transactionHash);
  } else {
    console.log("提取失败");
  }
}

// swap();
// 启动定时器
setInterval(Cooking, interval);
