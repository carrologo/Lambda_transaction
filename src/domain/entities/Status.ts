export interface IStatus {
  id_status: number;
  name: string;
}

export class Status implements IStatus {
  id_status: number;
  name: string;

  constructor(data: IStatus) {
    this.id_status = data.id_status;
    this.name = data.name;
  }
}