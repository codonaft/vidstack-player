import type { DefaultLayoutContext } from '../../../../../components/layouts/default/context';
import {
  i18n,
  type DefaultLayoutWord,
} from '../../../../../components/layouts/default/translations';
import { $signal } from '../../../../lit/directives/signal';

export function $i18n(
  translations: DefaultLayoutContext['translations'],
  word: DefaultLayoutWord,
  hotkey?: string,
) {
  return $signal(() => i18n(translations, word, hotkey));
}
