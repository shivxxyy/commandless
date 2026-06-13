import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  Video,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const FPS = 60;
const SOURCE_W = 2618;
const SOURCE_H = 1472;
const FRAME_W = 1600;
const FRAME_H = 900;
const FRAME_TOP = 32;
const BLACK = '#06080a';
const GREEN = '#3fc07d';
const GREEN_DARK = '#27a35f';
const WHITE = '#f7fff9';
const MUTED = '#a9b7af';

const seconds = (value) => Math.round(value * FPS);

const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';

const crops = {
  // Removes the macOS traffic lights/title bar while keeping the app in a clean 16:9 frame.
  appClean: {x: 49, y: 55, w: 2520, h: 1417.5},
  promptCard: {x: 505, y: 575, w: 1530, h: 860.625},
  commandCard: {x: 520, y: 570, w: 1530, h: 860.625},
  terminalOutput: {x: 12, y: 135, w: 1700, h: 956.25},
  aiCard: {x: 398, y: 465, w: 1780, h: 1001.25},
  dangerCard: {x: 500, y: 470, w: 1780, h: 1001.25},
  terminalFinal: {x: 0, y: 120, w: 1740, h: 978.75},
};

const voiceover = [
  {src: 'voiceover-v4/01-plain-english.mp3', at: 0.55, end: 5.35},
  {src: 'voiceover-v4/02-review-command.mp3', at: 6.25, end: 10.85},
  {src: 'voiceover-v4/03-real-output.mp3', at: 14.55, end: 19.25},
  {src: 'voiceover-v4/04-risk-labels.mp3', at: 29.25, end: 32.4},
  {src: 'voiceover-v4/05-control.mp3', at: 39.1, end: 42.15},
  {src: 'voiceover-v4/06-cta.mp3', at: 45.7, end: 50.4},
];

const captions = [
  {
    from: 6.05,
    to: 10.95,
    kicker: 'Command preview',
    parts: [
      ['Describe the task. ', false],
      ['Review the command', true],
      [' before it runs.', false],
    ],
  },
  {
    from: 14.35,
    to: 19.55,
    kicker: 'Real execution',
    parts: [
      ['Safe tasks run right away, with ', false],
      ['real terminal output', true],
      ['.', false],
    ],
  },
  {
    from: 29.05,
    to: 32.75,
    kicker: 'Risk review',
    parts: [
      ['Risky commands are ', false],
      ['clearly marked', true],
      [' first.', false],
    ],
  },
  {
    from: 38.95,
    to: 42.35,
    kicker: 'Real terminal',
    parts: [
      ['It is still your terminal. ', false],
      ['You stay in control', true],
      ['.', false],
    ],
  },
  {
    from: 45.55,
    to: 50.5,
    kicker: 'CommandLess',
    parts: [
      ['Terminal power. ', false],
      ['No command memorization', true],
      ['.', false],
    ],
  },
];

const scenes = [
  {
    key: 'first-card',
    from: 5.1,
    duration: 5.8,
    src: 'raw-demo-v2.mov',
    srcStart: 4.15,
    playbackRate: 1.05,
    cropFrom: crops.appClean,
    cropTo: crops.promptCard,
  },
  {
    key: 'safe-card',
    from: 10.9,
    duration: 5.4,
    src: 'raw-demo-v2.mov',
    srcStart: 9.2,
    playbackRate: 1.22,
    cropFrom: crops.appClean,
    cropTo: crops.commandCard,
  },
  {
    key: 'terminal-output',
    from: 16.3,
    duration: 5.7,
    src: 'raw-demo-v2.mov',
    srcStart: 16.0,
    playbackRate: 1.22,
    cropFrom: crops.terminalOutput,
    cropTo: crops.terminalOutput,
  },
  {
    key: 'ai-card',
    from: 22.0,
    duration: 6.4,
    src: 'ai-card-resolved.mov',
    srcStart: 0.1,
    playbackRate: 0.92,
    cropFrom: crops.appClean,
    cropTo: crops.aiCard,
  },
  {
    key: 'dangerous',
    from: 28.4,
    duration: 7.8,
    src: 'raw-demo-v2.mov',
    srcStart: 31.75,
    playbackRate: 1.0,
    cropFrom: crops.appClean,
    cropTo: crops.dangerCard,
  },
  {
    key: 'real-terminal',
    from: 36.2,
    duration: 7.8,
    src: 'raw-demo-v2.mov',
    srcStart: 39.2,
    playbackRate: 1.18,
    cropFrom: crops.terminalFinal,
    cropTo: crops.terminalFinal,
  },
];

export const CommandLessLaunch = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const musicVolume = () => {
    const fadeIn = interpolate(frame, [0, seconds(1.2)], [0, 0.78], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const fadeOut = interpolate(frame, [durationInFrames - seconds(4.5), durationInFrames], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const duck = voiceover.some(({at, end}) => frame >= seconds(at - 0.2) && frame <= seconds(end + 0.25))
      ? 0.42
      : 0.72;

    return fadeIn * fadeOut * duck;
  };

  return (
    <AbsoluteFill style={{backgroundColor: BLACK, color: WHITE, fontFamily: fontStack}}>
      <IntroCard from={0} duration={seconds(5.1)} />
      {scenes.map((scene) => (
        <Sequence key={scene.key} from={seconds(scene.from)} durationInFrames={seconds(scene.duration)}>
          <ActionScene {...scene} />
        </Sequence>
      ))}
      <EndCard from={seconds(44.0)} duration={seconds(8.0)} />
      <CaptionLayer />
      <Audio src={staticFile('audio/calm-tech-bed.mp3')} volume={musicVolume} />
      {voiceover.map((clip) => (
        <Sequence key={clip.src} from={seconds(clip.at)}>
          <Audio src={staticFile(clip.src)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const IntroCard = ({from, duration}) => (
  <Sequence from={from} durationInFrames={duration}>
    <AbsoluteFill style={{backgroundColor: BLACK}}>
      <SubtleBackdrop />
      <BrandBlock
        style={{
          left: 120,
          top: 116,
          transform: 'scale(1)',
          transformOrigin: 'left top',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 124,
          bottom: 132,
          width: 1000,
          fontSize: 78,
          lineHeight: 0.98,
          fontWeight: 760,
          letterSpacing: 0,
        }}
      >
        Plain English.
        <br />
        Real terminal power.
      </div>
      <div
        style={{
          position: 'absolute',
          left: 128,
          bottom: 70,
          color: MUTED,
          fontSize: 24,
          lineHeight: 1.3,
          fontWeight: 500,
        }}
      >
        No command memorization.
      </div>
    </AbsoluteFill>
  </Sequence>
);

const EndCard = ({from, duration}) => (
  <Sequence from={from} durationInFrames={duration}>
    <FadeEnvelope duration={duration} fadeIn={18} fadeOut={0}>
      <AbsoluteFill style={{backgroundColor: BLACK}}>
        <SubtleBackdrop />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 30,
          }}
        >
          <BrandBlock centered />
          <div
            style={{
              color: MUTED,
              fontSize: 30,
              lineHeight: 1.25,
              fontWeight: 560,
            }}
          >
            Terminal power. No command memorization.
          </div>
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              fontSize: 24,
              color: WHITE,
              fontWeight: 620,
            }}
          >
            <span>Free for macOS & Windows</span>
            <span style={{width: 7, height: 7, borderRadius: 999, background: GREEN_DARK}} />
            <span style={{color: GREEN}}>github.com/shivxxyy/commandless</span>
          </div>
        </div>
      </AbsoluteFill>
    </FadeEnvelope>
  </Sequence>
);

const ActionScene = ({src, srcStart, playbackRate, duration, cropFrom, cropTo}) => {
  const frame = useCurrentFrame();
  const punch = Easing.out(Easing.cubic)(
    interpolate(frame, [0, 24], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const crop = mixCrop(cropFrom, cropTo, punch);

  return (
    <FadeEnvelope duration={seconds(duration)} fadeIn={4} fadeOut={4}>
      <AbsoluteFill style={{backgroundColor: BLACK}}>
        <SubtleBackdrop />
        <div
          style={{
            position: 'absolute',
            left: (1920 - FRAME_W) / 2,
            top: FRAME_TOP,
            width: FRAME_W,
            height: FRAME_H,
            overflow: 'hidden',
            borderRadius: 18,
            background: '#050707',
            border: '1px solid rgba(63,192,125,0.16)',
            boxShadow:
              '0 34px 120px rgba(0,0,0,0.62), 0 0 0 1px rgba(255,255,255,0.035), 0 0 48px rgba(63,192,125,0.08)',
          }}
        >
          <CroppedVideo
            src={src}
            srcStart={srcStart}
            playbackRate={playbackRate}
            crop={crop}
            outW={FRAME_W}
            outH={FRAME_H}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(6,8,10,0.08) 0%, transparent 44%, rgba(6,8,10,0.52) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </AbsoluteFill>
    </FadeEnvelope>
  );
};

const CroppedVideo = ({src, srcStart, playbackRate, crop, outW, outH}) => {
  const scaleX = outW / crop.w;
  const scaleY = outH / crop.h;

  return (
    <Video
      src={staticFile(src)}
      startFrom={seconds(srcStart)}
      playbackRate={playbackRate}
      volume={0}
      style={{
        position: 'absolute',
        left: -crop.x * scaleX,
        top: -crop.y * scaleY,
        width: SOURCE_W * scaleX,
        height: SOURCE_H * scaleY,
        filter: 'contrast(1.1) saturate(1.2) brightness(1.05)',
      }}
    />
  );
};

const CaptionLayer = () => {
  const frame = useCurrentFrame();

  return (
    <>
      {captions.map((caption) => {
        const from = seconds(caption.from);
        const to = seconds(caption.to);
        const opacity =
          frame < from || frame > to
            ? 0
            : Math.min(
                interpolate(frame, [from, from + 10], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
                interpolate(frame, [to - 10, to], [1, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              );

        return (
          <div
            key={`${caption.from}-${caption.to}`}
            style={{
              position: 'absolute',
              left: 96,
              bottom: 54,
              width: 1180,
              opacity,
              textShadow: '0 2px 30px rgba(0,0,0,0.88)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
                padding: '7px 12px',
                borderRadius: 999,
                background: 'rgba(6,8,10,0.76)',
                border: '1px solid rgba(63,192,125,0.22)',
                color: MUTED,
                fontSize: 18,
                lineHeight: 1,
                fontWeight: 650,
              }}
            >
              <span style={{width: 7, height: 7, borderRadius: 999, background: GREEN}} />
              {caption.kicker}
            </div>
            <div
              style={{
                color: WHITE,
                fontSize: 38,
                lineHeight: 1.12,
                fontWeight: 740,
                letterSpacing: 0,
              }}
            >
              {caption.parts.map(([text, highlight], index) => (
                <span key={`${text}-${index}`} style={{color: highlight ? GREEN : WHITE}}>
                  {text}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

const FadeEnvelope = ({children, duration, fadeIn = 8, fadeOut = 8}) => {
  const frame = useCurrentFrame();
  const inOpacity = interpolate(frame, [0, fadeIn], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outOpacity =
    fadeOut === 0
      ? 1
      : interpolate(frame, [duration - fadeOut, duration], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  return <AbsoluteFill style={{opacity: inOpacity * outOpacity}}>{children}</AbsoluteFill>;
};

const BrandBlock = ({style, centered = false}) => (
  <div
    style={{
      position: centered ? 'relative' : 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: centered ? 'center' : 'flex-start',
      gap: 21,
      ...style,
    }}
  >
    <Img
      src={staticFile('app-icon.png')}
      style={{
        width: centered ? 92 : 68,
        height: centered ? 92 : 68,
        borderRadius: centered ? 22 : 18,
        boxShadow: '0 20px 54px rgba(0,0,0,0.40), 0 0 28px rgba(63,192,125,0.16)',
      }}
    />
    <div
      style={{
        fontSize: centered ? 76 : 50,
        lineHeight: 1,
        fontWeight: 780,
        letterSpacing: 0,
      }}
    >
      <span style={{color: WHITE}}>Command</span>
      <span style={{color: GREEN}}>Less</span>
    </div>
  </div>
);

const SubtleBackdrop = () => (
  <AbsoluteFill
    style={{
      background:
        'linear-gradient(180deg, #070a0d 0%, #06080a 48%, #030405 100%)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.075,
        backgroundImage:
          'linear-gradient(rgba(63,192,125,0.20) 1px, transparent 1px), linear-gradient(90deg, rgba(63,192,125,0.16) 1px, transparent 1px)',
        backgroundSize: '84px 84px',
      }}
    />
  </AbsoluteFill>
);

const mixCrop = (from, to, t) => ({
  x: interpolate(t, [0, 1], [from.x, to.x]),
  y: interpolate(t, [0, 1], [from.y, to.y]),
  w: interpolate(t, [0, 1], [from.w, to.w]),
  h: interpolate(t, [0, 1], [from.h, to.h]),
});
