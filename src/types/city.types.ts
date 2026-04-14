export interface CityDto {
  id: number;
  name: string;
  stateId: number;
  isActive: boolean;
  isComingSoon: boolean;
}

export interface StateDto {
  id: number;
  name: string;
  isActive: boolean;
}