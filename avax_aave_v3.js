const { ethers } = require("ethers");
const WAVAXABI = require("./contract_json/WAVAX.json");
const ATokenABI = require("./contract_json/AToken.json");
const L1AaveV3PoolABI = require("./contract_json/L1AaveV3Pool.json");

require("dotenv").config({ path: ".env" });

const referralCode = 0;
const WAVAXAddress = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
const AvaxAaveWAVAXAddress = "0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97";
const AvaxAaveV3PoolAddress = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";

//设置时间多久重复执行
// 定时器间隔（单位：毫秒）
const interval = 60000; //60 s

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_KEY);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const WAVAX = new ethers.Contract(WAVAXAddress, WAVAXABI, signer);
const AvaxAaveWAVAX = new ethers.Contract(
  AvaxAaveWAVAXAddress,
  ATokenABI,
  signer
);
const L1AaveV3Pool = new ethers.Contract(
  AvaxAaveV3PoolAddress,
  L1AaveV3PoolABI,
  signer
);

async function getNonce(userAddress) {
  const nonce = await provider.getTransactionCount(userAddress);
  console.log("当前钱包的 nonce 值为：", nonce);
}

async function Cooking() {
  const currentAddress = await signer.getAddress();
  console.log("currentAddress:", currentAddress);

  const currentBalance = await WAVAX.balanceOf(currentAddress);
  console.log("AaveV3WAVAX数量", ethers.utils.formatEther(currentBalance));
  //50%
  const warpAmount = ethers.utils.formatEther(currentBalance) * 0.5;
  const warpAmountString = warpAmount.toString();
  console.log("交易数量:", warpAmountString);
  await Approve(WAVAX, currentAddress, AvaxAaveV3PoolAddress);
  await getNonce(currentAddress);
  //供应到aaveV3
  await Supply(warpAmountString, currentAddress);
  await getNonce(currentAddress);

  const thisBalance = await AvaxAaveWAVAX.balanceOf(currentAddress);
  const avaxAaveWAVAXBalance = ethers.utils.formatEther(thisBalance) * 0.99;
  const avaxAaveWAVAXBalanceString = avaxAaveWAVAXBalance.toString();
  console.log("AaveV3WAVAX数量", avaxAaveWAVAXBalance);
  await Approve(
    AvaxAaveWAVAX,
    currentAddress,
    AvaxAaveV3PoolAddress
  );
  await Withdraw(avaxAaveWAVAXBalanceString, currentAddress);
  await getNonce(currentAddress);
}

async function Approve(ERC20Contract, owner, spender) {
  const tokenAmount = ethers.utils.parseEther("10") ;
  const allowance = await ERC20Contract.allowance(owner, spender);
  if (allowance < tokenAmount) {
    const approve = await ERC20Contract.approve(spender, tokenAmount);
    const approveTx = await approve.wait();
    if (approveTx.status === 1) {
      console.log("Approve success:", approveTx.transactionHash);
    } else {
      console.log("Approve fail");
    }
  }else{
    console.log("Not approve");
  }
}

async function Supply(amount, receiver) {
  const tokenAmount = ethers.utils.parseEther(amount);
  const supply = await L1AaveV3Pool.supply(
    WAVAXAddress,
    tokenAmount,
    receiver,
    referralCode
  );
  const supplyTx = await supply.wait();
  if (supplyTx.status === 1) {
    console.log("存入成功:", supplyTx.transactionHash);
  } else {
    console.log("存入失败");
  }
}

async function Withdraw(amount, receiver) {
  const tokenAmount = ethers.utils.parseEther(amount);
  const withdraw = await L1AaveV3Pool.withdraw(
    WAVAXAddress,
    tokenAmount,
    receiver
  );
  const withdrawTx = await withdraw.wait();
  if (withdrawTx.status === 1) {
    console.log("提取成功:", withdrawTx.transactionHash);
  } else {
    console.log("提取失败");
  }
}

// 启动定时器
setInterval(Cooking, interval);
