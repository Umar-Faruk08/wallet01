const express = require("express");
const fs = require("fs");
const { ethers } = require("ethers");

const app = express();

app.use(express.json());

const provider = new ethers.JsonRpcProvider(
    "https://ethereum-sepolia-rpc.publicnode.com"
);
const apiKey = "DRMQIVXYR1BBBUSY97AY3XACPAANR8YZ6S";

// Save wallet
app.post("/save-wallet", (req, res) => {

    // If wallet already exists, don't create another one
    if (fs.existsSync("wallet.json")) {

        return res.json({
            message: "Existing wallet loaded"
        });
    }

    const walletData = {
        address: req.body.address,
        privateKey: req.body.privateKey
    };

    fs.writeFileSync(
        "wallet.json",
        JSON.stringify(walletData, null, 2)
    );

    res.json({
        message: "New wallet saved successfully"
    });
});
app.get("/wallet", (req, res) => {

    try {

        if (fs.existsSync("wallet.json")) {

            const walletData = JSON.parse(
                fs.readFileSync("wallet.json", "utf8")
            );

            res.json({
                message: "Existing wallet loaded",
                address: walletData.address,
                privateKey: walletData.privateKey
            });

        } else {

            const wallet = ethers.Wallet.createRandom();

            const walletData = {
                address: wallet.address,
                privateKey: wallet.privateKey
            };

            fs.writeFileSync(
                "wallet.json",
                JSON.stringify(walletData, null, 2)
            );

            res.json({
                message: "New wallet created",
                address: wallet.address,
                privateKey: wallet.privateKey
            });
        }

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });
    }
});

// Get balance
app.get("/balance", async (req, res) => {

    try {

        const walletData = JSON.parse(
            fs.readFileSync("wallet.json", "utf8")
        );

        const balance = await provider.getBalance(
            walletData.address
        );

        const ethBalance = ethers.formatEther(balance);

        res.json({
            address: walletData.address,
            balance: ethBalance
        });

    } catch (error) {

        console.log("BALANCE ERROR:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// Send transaction
app.post("/send-transaction", async (req, res) => {

    try {

        const walletData = JSON.parse(
            fs.readFileSync("wallet.json", "utf8")
        );

        const wallet = new ethers.Wallet(
            walletData.privateKey,
            provider
        );

        const receiverAddress = req.body.receiverAddress;
        const amount = req.body.amount;

        const transaction = await wallet.sendTransaction({
            to: receiverAddress,
            value: ethers.parseEther(amount)
        });

        console.log("Transaction sent:", transaction.hash);

        await transaction.wait();

        console.log("Transaction confirmed!");

        res.json({
            message: "Transaction confirmed",
            hash: transaction.hash
        });

    } catch (error) {

        console.log("TRANSACTION ERROR:", error);

        res.status(500).json({
            error: error.message
        });
    }
});
app.get("/transactions", async (req, res) => {

    try {

        const walletData = JSON.parse(
            fs.readFileSync("wallet.json", "utf8")
        );

        const address = walletData.address;

        const apiKey = "DRMQIVXYR1BBBUSY97AY3XACPAANR8YZ6S";

        const url =
            `https://api.etherscan.io/v2/api?chainid=11155111` +
            `&module=account` +
            `&action=txlist` +
            `&address=${address}` +
            `&startblock=0` +
            `&endblock=99999999` +
            `&page=1` +
            `&offset=10` +
            `&sort=desc` +
            `&apikey=${apiKey}`;

        const response = await fetch(url);

        const data = await response.json();
console.log("ETHERSCAN RESPONSE:", data);

        if (data.status !== "1" && data.message !== "No transactions found") {

            return res.status(500).json({
                error: data.result
            });
        }

        const transactions = data.result || [];

        const formattedTransactions =
    transactions.map(tx => ({

        hash: tx.hash,

        from: tx.from,

        to: tx.to,

        amount: ethers.formatEther(tx.value),

        blockNumber: tx.blockNumber,

        timestamp: tx.timeStamp,

        gasUsed: tx.gasUsed,

        gasPrice: tx.gasPrice,

        status: tx.txreceipt_status,

        type:
            tx.from.toLowerCase() === address.toLowerCase()
                ? "Sent"
                : "Received"

    }));

        res.json(formattedTransactions);

    } catch (error) {

        console.log(
            "TRANSACTION HISTORY ERROR:",
            error
        );

        res.status(500).json({
            error: error.message
        });
    }
});
app.get("/transaction/:hash", async (req, res) => {

    try {

        const hash = req.params.hash;

        const transaction =
            await provider.getTransaction(hash);

        const receipt =
            await provider.getTransactionReceipt(hash);

        if (!transaction) {
            return res.status(404).json({
                error: "Transaction not found"
            });
        }

        res.json({
            hash: transaction.hash,
            from: transaction.from,
            to: transaction.to,
            amount: ethers.formatEther(transaction.value),
            blockNumber: receipt
                ? receipt.blockNumber
                : transaction.blockNumber,
            status: receipt
                ? receipt.status
                : null,
            gasUsed: receipt
                ? receipt.gasUsed.toString()
                : null,
            gasPrice: transaction.gasPrice
                ? ethers.formatUnits(
                    transaction.gasPrice,
                    "gwei"
                )
                : null
        });

    } catch (error) {

        console.log("TRANSACTION DETAILS ERROR:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// Start server
app.listen(3000, () => {

    console.log(
        "Server running at http://localhost:3000"
    );

});