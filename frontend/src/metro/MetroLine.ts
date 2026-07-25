import { MetroRoute } from '@/metro/MetroRoute';
import { MetroStation } from '@/metro/MetroStation';
import { MetroTrain } from '@/metro/MetroTrain';
import type { ResolvedDeparture } from '@/metro/MetroSchedule';
import type { MetroLineJson, MetroStationData } from '@/metro/types';

export type MetroStationLookup = (stopId: string) => MetroStationData | undefined;

/**
 * Одна лінія метро: id/номер/назва/колір + два напрямки руху (MetroRoute).
 *
 * Список рейсів на добу (departures) обчислюється ОДИН РАЗ при побудові
 * лінії (у конструкторі) — детерміновано, з розкладу. Симуляційний рушій
 * потім лише фільтрує цей вже готовий список за поточним часом, нічого
 * не генеруючи заново на кожен тік.
 */
export class MetroLine {
  readonly id: string;
  readonly number: string;
  readonly name: string;
  readonly color: string;

  readonly forwardRoute: MetroRoute;
  readonly backwardRoute: MetroRoute;

  private readonly forwardDepartures: ResolvedDeparture[];
  private readonly backwardDepartures: ResolvedDeparture[];

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

    this.forwardDepartures = this.forwardRoute.schedule.buildDailyDepartures();
    this.backwardDepartures = this.backwardRoute.schedule.buildDailyDepartures();
  }

  /**
   * Усі потяги, що мають перебувати на лінії (в обох напрямках) у момент
   * nowSec. Список рейсів вже готовий (побудований у конструкторі) —
   * тут лише O(n) фільтр + створення легких об'єктів MetroTrain-обгорток
   * для активних рейсів.
   */
  getActiveTrains(nowSec: number): MetroTrain[] {
    const context = { lineId: this.id, lineNumber: this.number, lineName: this.name, lineColor: this.color };
    const trains: MetroTrain[] = [];

    for (const departure of this.forwardDepartures) {
      const train = new MetroTrain(this.forwardRoute, departure.departureAtSec, context);
      if (train.isActiveAt(nowSec)) trains.push(train);
    }
    for (const departure of this.backwardDepartures) {
      const train = new MetroTrain(this.backwardRoute, departure.departureAtSec, context);
      if (train.isActiveAt(nowSec)) trains.push(train);
    }

    return trains;
  }
}
