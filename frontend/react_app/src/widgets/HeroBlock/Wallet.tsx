import './Wallet.css';
import walletBack from '../../shared/image/wallet_back.png';
import coin from '../../shared/image/coin.png';
import walletFront from '../../shared/image/wallet1.png';


export default function Wallet() {
    return (
        <div className="wallet-scene">
            <img className="wallet-back" src={walletBack} alt="wallet back" />
            <img className="coin coin-2" src={coin} alt="wallet back" />
            <img className="coin coin-1" src={coin} alt="wallet back" />
            <img className="wallet-front" src={walletFront} alt="wallet back" />
        </div>
    );
}
