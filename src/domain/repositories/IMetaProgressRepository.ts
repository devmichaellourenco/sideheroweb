import { MetaProgress } from '../meta/MetaProgress';

export interface IMetaProgressRepository {
  load(): Promise<MetaProgress>;
  save(progress: MetaProgress): Promise<void>;
}
