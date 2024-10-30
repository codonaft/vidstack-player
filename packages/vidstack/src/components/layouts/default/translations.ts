import type { ReadSignal } from 'maverick.js';

import { useDefaultLayoutContext } from '../../layouts/default/context';

export type DefaultLayoutWord =
  | 'Announcements'
  | 'Accessibility'
  | 'AirPlay'
  | 'Audio'
  | 'Auto'
  | 'Boost'
  | 'Captions'
  | 'Caption Styles'
  | 'Captions look like this'
  | 'Chapters'
  | 'Subtitles Off'
  | 'Subtitles On'
  | 'Connected'
  | 'Continue'
  | 'Connecting'
  | 'Default'
  | 'Disabled'
  | 'Disconnected'
  | 'Display Background'
  | 'Download'
  | 'Exit Fullscreen'
  | 'Exit Picture-in-Picture'
  | 'Font'
  | 'Family'
  | 'Fullscreen'
  | 'Google Cast'
  | 'Keyboard Animations'
  | 'LIVE'
  | 'Loop'
  | 'Mute'
  | 'Normal'
  | 'Off'
  | 'Pause'
  | 'Play'
  | 'Playback'
  | 'Picture-in-Picture'
  | 'Quality'
  | 'Replay'
  | 'Reset'
  | 'Seek Backward'
  | 'Seek Forward'
  | 'Seek'
  | 'Settings'
  | 'Skip To Live'
  | 'Speed'
  | 'Size'
  | 'Color'
  | 'Opacity'
  | 'Shadow'
  | 'Text'
  | 'Text Background'
  | 'Track'
  | 'Unmute'
  | 'Volume';

export type DefaultLayoutTranslations = {
  [word in DefaultLayoutWord]: string;
};

export function i18n(
  translations: ReadSignal<Partial<DefaultLayoutTranslations> | null>,
  word: string,
  hotkey?: string,
) {
  const { smallWhen } = useDefaultLayoutContext();
  const hint = hotkey && !smallWhen() ? `(⌨️${hotkey}) ` : '';
  //return hint + (translations()?.[word] ?? word);
  return hint + word;
}
