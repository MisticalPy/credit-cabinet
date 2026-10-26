// @ts-ignore
import React from 'react';
import {useState} from "react";
import './Header.css'
import {useAuth} from "../../entities/session/model/Auth-context.ts";
import { ProfileDrawer } from '../../pages/Login/UI/ProfileDrawer';

function Header(){
    const { openLogin, status } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);

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
                        {status === 'ready' ? (
                            <div className={"headerRightButtonsR"}>
                                <a className={"inCabinetA"} href="/" onClick={(e) => { e.preventDefault(); setProfileOpen(true); }}>
                                    <span className={"inCabinetTextA"}>Профиль</span>
                                </a>
                            </div>
                        ) : (
                            <>
                                <div className={"headerRightButtonsL"}>
                                    <a className={"willClient"} href="https://alfabank.ru/lp/retail/startclient/">
                                        <span className={"willClientText"}>Стать клиентом</span>
                                    </a>
                                </div>
                                <div className="headerRightButtonsR" role="button" tabIndex={0}>
                                    <a className={"inCabinet"} href="/" onClick={(e) => { e.preventDefault(); openLogin(); }}>
                                        <span className={"inCabinetText"}>Войти</span>
                                    </a>
                                </div>
                            </>
                        )}
                        <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Header;