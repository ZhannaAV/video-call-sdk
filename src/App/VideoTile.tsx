import React, {memo} from 'react';
import { useEffect, useRef } from 'react';

export const VideoTile = memo(({ stream }: { stream: MediaStream }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && stream instanceof MediaStream) {
            ref.current.srcObject = stream;
        }
    }, [stream]);

    return <video ref={ref} autoPlay muted style={{ width: '300px', margin: '10px' }} />;
});
