
import React, { useEffect, useState } from 'react';
import './App.css';
import idl from './idl.json';
import kp from './keypair.json'
import { Buffer } from 'buffer';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStroopwafel } from '@fortawesome/free-solid-svg-icons'

library.add(faStroopwafel)

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
window.Buffer = Buffer;

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram } = web3;

// Create a keypair for the account that will hold the GIF data.
// let baseAccount = Keypair.generate();

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}
// Constants


const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const checkIfWallet = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log('Wallet is connected');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log('Connected with Public Key:', response.publicKey.toString());
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log("Connected with Public key:", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputValue('');
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    console.log("input event", event.target);
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  };
  /*
   * We want to render this UI when the user hasn't connected
   * their wallet to our app yet.
   */
  const renderNotConnectedContainer = () => (

    <div className="cta-wallet-container">
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect to Wallet
      </button>
    </div>
  );

  const renderConnectedContainer = () => {
    console.log(gifList)
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return (
        <div className="connected-container">
          <div className="headres">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendGif();
              }}
            >
              <input
                type="text"
                placeholder="Enter gif link!"
                value={inputValue}
                onChange={onInputChange}
              />
              <button type="submit" className="cta-button submit-gif-button">
                Submit
              </button>
            </form>
          </div>

          <div className="gif-grid">

            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
                <p className="sub-text-grid">Upvotes {item.votes}</p>
                <p className="sub-text-grid">Poster Address - {item.userAddress.toString()}</p>
                <div className="vote-button">
                  <button className="button-8" onClick={() => upvoteGif(item.gifLink)}>UpVote</button>
                  <button className="button-8" onClick={() => downVoteGif(item.gifLink)}>DownVote</button>
                </div>
              </div>
            ))}
          </div>
        </div >
      )
    }
  }

  const deleteGif = async (gifLink) => {
    console.log("downvoting Gif called...")
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping delete...", baseAccount)
      await program.rpc.deleteGif(gifLink, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
      });
      console.log("Downvote Gif:", baseAccount.publicKey.toString())
      await getGifList();

    } catch (error) {
      console.log("Error upvoting:", error);
      console.error(error);
    }
  }

  const downVoteGif = async (gifLink) => {
    console.log("downvoting Gif called...")
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping upvote...", baseAccount)
      await program.rpc.downVoteGif(gifLink, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
      });
      console.log("Downvote Gif:", baseAccount.publicKey.toString())
      await getGifList();

    } catch (error) {
      console.log("Error upvoting:", error);
      console.error(error);
    }
  }

  const upvoteGif = async (gifLink) => {
    console.log("updateGif called...")
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping upvote...", baseAccount)
      await program.rpc.upvoteGif(gifLink, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
      });
      console.log("UpvoteGif:", baseAccount.publicKey.toString())
      await getGifList();

    } catch (error) {
      console.log("Error upvoting:", error);
      console.error(error);
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();

    } catch (error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account)
      setGifList(account.gifList)

    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className={walletAddress ? 'authed-container' : 'container'}>
      <div className="container">
        <div className="header">
          <p className="sub-text">
            Your GIFs in the Matrix.. <FontAwesomeIcon icon="stroopwafel" />
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
      </div>
    </div>
  );
};

export default App;
