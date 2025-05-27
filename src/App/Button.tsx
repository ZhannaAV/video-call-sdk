import {observer} from "mobx-react-lite";
import {store} from "../store/CallStore";
import React from "react";

export const Button = observer(({onClick}) => {
    return (
        <button onClick={onClick} style={{padding: 10, fontSize: 16, background: "transparent", borderRadius: 4, color: `${store.connected ? 'red' : 'green'}`}}>
            {store.connected ? 'выйти' : 'войти'}
        </button>
    );
});
