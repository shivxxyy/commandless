import {registerRoot, Composition} from 'remotion';
import {CommandLessLaunch} from './CommandLessLaunch.jsx';

const Root = () => (
  <Composition
    id="CommandLessLaunch"
    component={CommandLessLaunch}
    durationInFrames={3120}
    fps={60}
    width={1920}
    height={1080}
  />
);

registerRoot(Root);
