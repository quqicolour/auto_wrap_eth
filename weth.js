const {ethers} = require('ethers');
const WETHABI=require('./contract_json/WETH.json');
require("dotenv").config({ path: ".env" });

//mode
const WETHAddress="0x4200000000000000000000000000000000000006";

//设置时间多久重复执行
// 定时器间隔（单位：毫秒）
const interval = 25000; //25 s


const provider = new ethers.providers.JsonRpcProvider(
    process.env.RPC_KEY
);

const signer = new ethers.Wallet(
    process.env.PRIVATE_KEY,
    provider
);


const WETH=new ethers.Contract(WETHAddress,WETHABI,signer);

async function swap(){
    const currentAddress=await signer.getAddress();
    console.log("currentAddress:",currentAddress);
    //执行weth存入
   
    const currentBalance=await provider.getBalance(currentAddress);
    console.log("balance:",ethers.utils.formatEther(currentBalance));

    //80%
    const swapAmount=ethers.utils.formatEther(currentBalance)*0.8;
    const swapAmountString=swapAmount.toString();
    console.log("交易数量:",swapAmountString);

    const depositETH=await WETH.deposit({value: ethers.utils.parseEther(swapAmountString)});
    const depositETHTx=await depositETH.wait();
    if(depositETHTx.status===1){
        console.log("存入成功");
        const thisBalance=await WETH.balanceOf(currentAddress);
        console.log("提取的WETH数量",ethers.utils.formatEther(thisBalance));
        const withdrawETH=await WETH.withdraw(thisBalance);
        const withdrawETHTx=await withdrawETH.wait();
        if(withdrawETHTx.status===1){
            console.log("提取成功");
        }else{
            console.log("提取失败");
        }
    }else{
        console.log("存入失败");
    }
}
// swap();
// 启动定时器
setInterval(swap, interval);
