import { MetroRoute } from '@/metro/MetroRoute';
import { MetroStation } from '@/metro/MetroStation';
import { MetroTrain } from '@/metro/MetroTrain';
import type { ResolvedDeparture } from '@/metro/MetroSchedule';
import type { MetroDayType, MetroLineJson, MetroStationData } from '@/metro/types';

export type MetroStationLookup = (stopId: string) => MetroStationData | undefined;

/**
 * Одна лінія метро: id/номер/назва/колір + два напрямки руху (MetroRoute).
 *
 * Список рейсів на добу (departures) обчислюється ОДИН РАЗ при побудові
 * лінії (у конструкторі) — детерміновано, з розкладу, ОКРЕМО для будніх
 * і вихідних днів (інтервал руху відрізняється: за офіційними даними
 * КП «Харківський метрополітен» будні їздять частіше за вихідні).
 * Симуляційний рушій потім лише фільтрує вже готовий список за поточним
 * часом і типом доби, нічого не генеруючи заново на кожен тік.
 */
export class MetroLine {
  readonly id: string;
  readonly number: string;
  readonly name: string;
  readonly color: string;

  readonly forwardRoute: MetroRoute;
  readonly backwardRoute: MetroRoute;

  private readonly departuresByDayType: Record<MetroDayType, { forward: ResolvedDeparture[]; backward: ResolvedDeparture[] }>;

  constructor(line: MetroLineJson, stationLookup: MetroStationLookup) {
    if (line.kind !== 'metro') {
      throw new Error(`MetroLine: маршрут "${line.id}" не є лінією метро (kind="${line.kind}")`);
    }

    this.id = line.id;
    this.number = line.number;
    this.name = line.name;
    this.color = line.color;

    const stationsForward = line.stopIds.map((stopId) => {
      const data = stationLookup(stopId);
      if (!data) {
        throw new Error(`MetroLine: станцію "${stopId}" не знайдено в базі зупинок (лінія "${line.id}")`);
      }
      return new MetroStation(data);
    });

    if (stationsForward.length < 2) {
      throw new Error(`MetroLine: лінія "${line.id}" повинна мати щонайменше 2 станції`);
    }

    this.forwardRoute = new MetroRoute(line, stationsForward, 'forward');
    this.backwardRoute = new MetroRoute(line, stationsForward, 'backward');

    this.departuresByDayType = {
      weekday: {
        forward: this.forwardRoute.schedule.buildDailyDepartures('weekday'),
        backward: this.backwardRoute.schedule.buildDailyDepartures('weekday')
      },
      weekend: {
        forward: this.forwardRoute.schedule.buildDailyDepartures('weekend'),
        backward: this.backwardRoute.schedule.buildDailyDepartures('weekend')
      }
    };
  }

  /**
   * Усі потяги, що мають перебувати на лінії (в обох напрямках) у момент
   * nowSec заданого типу доби. Список рейсів вже готовий (побудований у
   * конструкторі для обох типів доби) — тут лише O(n) фільтр + створення
   * легких об'єктів MetroTrain-обгорток для активних рейсів.
   */
  getActiveTrains(nowSec: number, dayType: MetroDayType): MetroTrain[] {
    const context = { lineId: this.id, lineNumber: this.number, lineName: this.name, lineColor: this.color };
    const trains: MetroTrain[] = [];
    const departures = this.departuresByDayType[dayType];

    for (const departure of departures.forward) {
      const train = new MetroTrain(this.forwardRoute, departure.departureAtSec, context);
      if (train.isActiveAt(nowSec)) trains.push(train);
    }
    for (const departure of departures.backward) {
      const train = new MetroTrain(this.backwardRoute, departure.departureAtSec, context);
      if (train.isActiveAt(nowSec)) trains.push(train);
    }

    return trains;
  }
}
