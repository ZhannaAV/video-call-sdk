import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../store/CallStore';
import { VideoTile } from './VideoTile';

export const VideoGrid = observer(() => {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {store.streams.map(([userId, stream]) => (
                <VideoTile key={userId} stream={stream} />
            ))}
        </div>
    );
});
