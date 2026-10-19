// @ts-ignore
import React from 'react';
import './Header.css'

function Header(){
    return (
        <>
            <div className={"Header"}>
                <div className={"headerContent"}>
                    <img className={"headerLogo"} src={"src/shared/assets/alfa.svg"}/>
                    <div className={"headerButtonPrivatePerson"}>
                        <a href="/">
                            <p className={"headerText"}>Частным лицам</p>
                        </a>
                    </div>
                    <div className={"headerButtonSmallBusiness"}>
                        <a href="/">
                            <p className={"headerText"}>Малому бизнесу и ИП</p>
                        </a>
                    </div>
                    <div className={"headerButtonBigBusiness"}>
                        <a href="/">
                            <p className={"headerText"}>Среднему и крупному бизнесу</p>
                        </a>
                    </div>
                    <div className={"SmartSearch"}>
                        <a className={"SmartSearchLink"}></a>
                    </div>
                    <div className={"headerRightButtons"}>
                        <div className={"headerRightButtonsL"}>
                            <a className={"willClient"} href="/">
                                <span className={"willClientText"}>Стать клиентом</span>
                            </a>
                        </div>
                        <div className={"headerRightButtonsR"}>
                            <a className={"inCabinet"} href="/">
                                <span className={"inCabinetText"}>Войти</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Header;