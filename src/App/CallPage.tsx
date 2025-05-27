import React, {useMemo} from 'react';
import {observer} from 'mobx-react-lite';
import {VideoGrid} from './VideoGrid';
import {store} from '../store/CallStore';
import {SignalingChannel, VideoCallClient} from '../sdk';
import {Button} from "./Button";

const signaling = new SignalingChannel('ws://localhost:3000');
const client = new VideoCallClient(signaling);

export const CallPage = observer(() => {
    // для тестирования с двух вкладок
    const userId = useMemo(() => crypto.randomUUID(), []);

    function handleConnect() {
        client.on('connected', () => store.setConnected(true));
        client.on('disconnected', () => {
            store.setConnected(false)
            store.clearPeerStreams()
            client.off()
        });
        client.on('newTrack', (track, userId) => store.updatePeerStream(userId, new MediaStream([track])));
        client.on('userLeft', (userId) => store.removePeerStream(userId));
        client.on('error', console.error);
        client.joinCall(store.roomId, userId);
    }

    function handleDisconnect() {
        client.leaveCall(store.roomId, userId)
    }

    return (
        <div style={{padding: 20, display: 'flex', flexDirection: 'column'}}>
            <h4 style={{alignSelf: 'center'}}>Комната {store.roomId}</h4>
            {store.connected && <VideoGrid/>}
            <Button onClick={!store.connected ? handleConnect : handleDisconnect}/>
        </div>

    );
});
