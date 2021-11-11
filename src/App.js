import React, { useEffect, useState } from "react";
import './App.css';
import { ethers } from "ethers";
import abi from './utils/GmPortal.json';

const App = () => {
  /*
   * Just a state variable we use to store our user's public wallet.
   */
  const [currentAccount, setCurrentAccount] = useState("");
  const [emoji, setEmoji] = useState("");
  const [allGms, setAllGms] = useState([]);
  const [mining, setMining] = useState(false);
  const [gmCount, setGmCount] = useState(null);

  const contractAddress = "0x386b272665F76f307fDb45fF0214E642f520A42c";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllGms()
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const getAllGms = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const gmPortalContract = new ethers.Contract(contractAddress, contractABI, signer);


        const gms = await gmPortalContract.getAllGms();


        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let gmsCleaned = [];
        gms.forEach(gm => {
          gmsCleaned.push({
            address: gm.gmer,
            timestamp: new Date(gm.timestamp * 1000),
            message: gm.message
          });
        });


        setAllGms(gmsCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }


  useEffect(() => {
    let gmPortalContract;

    const onNewGm = (from, timestamp, message) => {
      console.log('NewGm', from, timestamp, message);
      setAllGms(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      gmPortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      gmPortalContract.on('NewGm', onNewGm);
    }

    return () => {
      if (gmPortalContract) {
        gmPortalContract.off('NewGm', onNewGm);
      }
    };
  }, []);



  const gm = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const gmPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
        * Execute the actual gm from your smart contract
        */
        const gmTxn = await gmPortalContract.gm(`gm ${emoji}`, { gasLimit: 300000 });
        setMining(true);
        console.log("Mining...", gmTxn.hash);

        await gmTxn.wait();
        console.log("Mined -- ", gmTxn.hash);
        setMining(false);


      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          🌅 GM Portal 🌅
        </div>

        {gmCount && (
          <div className="bio">
            Total gms: {gmCount}
          </div>
        )}

        {!currentAccount && (
          <div className="bio">
            Connect your wallet and press the gm button for a chance to win some ETH!
        </div>
        )}

        {currentAccount && !mining && (
          <div className="bio">
            Wallet connected! Say GM!
        </div>
        )}

        {mining && (
          <div className="bio">
            Mining...
        </div>
        )}
        {!mining && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <button className="gmButton" onClick={gm}>
              GM {emoji}
            </button>

            <div className="emojiPicker">
              <button onClick={() => { setEmoji("😊") }} >😊</button>
              <button onClick={() => { setEmoji("😐") }} >😐</button>
              <button onClick={() => { setEmoji("😫") }} >😫</button>

            </div>

          </div>
            )}

        {!currentAccount && (
              <button className="gmButton" onClick={connectWallet}>
                Connect Wallet
          </button>
            )}
            {allGms.map((gm, index) => {
              return (
                <div key={index} style={{ backgroundColor: "#66FCF1", marginTop: "16px", padding: "8px", borderRadius: 15 }}>
                  <div className={"gmRow"}><div className={"gmTitle"}>Address:</div><div className={"gmInfo"}>{gm.address}</div></div>
                  <div className={"gmRow"}><div className={"gmTitle"}>Time:</div> <div className={"gmInfo"}>{gm.timestamp.toString()}</div></div>
                  <div className={"gmRow"}><div className={"gmTitle"}>Message:</div> <div className={"gmInfo"}>{gm.message}</div></div>
                </div>
              )
            })}
          </div>
          </div>
          );
        }
        
export default App