  import { useAccount, useSignMessage } from "wagmi";
  import { disconnect } from '@wagmi/core'
  import Cookies from "js-cookie";
  import axios from "axios";
  import { AxiosResponse } from "axios";

  export const useEthWallet = () => {
    const { address:ethAddress, isConnected, chain } = useAccount();
    const { signMessage: ethSignMessage } = useSignMessage();

    const getchainsym = () => {
      return Cookies.get("Chain_symbol");
    };
    
    const getwallet = () => {
      return Cookies.get("erebrus_wallet");
    };
   

    const onSignMessageEth = async (setshowsignbutton) => {
      const chainsym = getchainsym();
      const erebrusWallet = getwallet();

      if (isConnected && window.ethereum) {
        const network = await window.ethereum.request({ method: 'net_version' });
        if (chainsym == "evm" && network === "desired_network_id" && erebrusWallet == null) {
          try {
            const REACT_APP_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

            const { data } = await axios.get(
              `${REACT_APP_GATEWAY_URL}api/v1.0/flowid?walletAddress=${ethAddress}&chain=${chainsym}`
            );

            const message = data.payload.eula;
            const nonce = data.payload.flowId;

            const payload = message + nonce;

            await ethSignMessage(
              { account: ethAddress,
                 message: payload},
              {
                onSuccess: async (data) =>{
                  // setSignature(data);
                  const authenticationData = {
                    flowId: nonce,
                    signature: data,
                  };

                  const authenticateApiUrl = `${REACT_APP_GATEWAY_URL}api/v1.0/authenticate?chain=${chainsym}`;

                  const config = {
                    url: authenticateApiUrl,
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    data: authenticationData,
                  };

                  // const authResponse = axios(config);
                  const authResponse: AxiosResponse<{ payload: { token: string; userId: string } }> =  await axios.post(authenticateApiUrl, authenticationData);
                  const token = authResponse?.data?.payload?.token;
                  const userId = authResponse?.data?.payload?.userId;

                  Cookies.set("erebrus_token", token, { expires: 7 });
                  Cookies.set("erebrus_wallet", ethAddress, {
                    expires: 7,
                  });
                  Cookies.set("erebrus_userid", userId, { expires: 7 });
                  Cookies.set("Chain_symbol", chainsym, { expires: 7 });
                  window.location.reload();
                },
                
                
              },
              
            );
  
          } catch (error) {
            console.error(error);
            setshowsignbutton(true);
          }
        }
      } else {
        alert('Please connect using MetaMask and switch to the correct network.');
      }
    };
   
    return { ethAddress, isConnected, onSignMessageEth , disconnect};
  };
