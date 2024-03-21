import type { PlyrLayoutProps } from '../../components';
import type { VidstackPlayerLayoutLoader } from './loader';

export class PlyrLayout implements VidstackPlayerLayoutLoader {
  constructor(readonly props?: Partial<PlyrLayoutProps>) {}

  async load() {
    await import('../../elements/bundles/player-layouts/plyr');
  }

  create() {
    const layout = document.createElement('media-plyr-layout');

    if (this.props) {
      for (const [prop, value] of Object.entries(this.props)) {
        layout[prop] = value;
      }
    }

    return [layout];
  }
}
