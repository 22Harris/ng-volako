import { TestBed } from '@angular/core/testing';
import { CentsPipe } from './cents.pipe';
import { SettingsService } from '../../core/services/settings.service';

describe('CentsPipe', () => {
  let pipe: CentsPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CentsPipe,
        {
          provide: SettingsService,
          useValue: { currencySymbol: () => 'Ar' },
        },
      ],
    });
    pipe = TestBed.inject(CentsPipe);
  });

  it('formate un entier positif avec le symbole de devise par défaut', () => {
    expect(pipe.transform(1000)).toBe('1.000 Ar');
  });

  it('formate un nombre négatif avec le signe moins', () => {
    expect(pipe.transform(-1500)).toBe('-1.500 Ar');
  });

  it('utilise le symbole de devise passé en paramètre en priorité', () => {
    expect(pipe.transform(2500, '€')).toBe('2.500 €');
  });

  it('formate zéro sans signe', () => {
    expect(pipe.transform(0)).toBe('0 Ar');
  });

  it('formate les grands nombres avec séparateurs de milliers', () => {
    expect(pipe.transform(1000000)).toBe('1.000.000 Ar');
  });

  it('formate les petits nombres sans séparateurs', () => {
    expect(pipe.transform(999)).toBe('999 Ar');
  });
});
