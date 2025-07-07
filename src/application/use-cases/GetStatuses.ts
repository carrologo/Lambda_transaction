import { Status } from "../../domain/entities/Status";
import { StatusRepository } from "../../domain/repositories/StatusRepository";

export class GetStatuses {
  constructor(private statusRepository: StatusRepository) {}

  async execute(): Promise<Status[]> {
    return await this.statusRepository.getAllStatuses();
  }
}

export class GetStatusById {
  constructor(private statusRepository: StatusRepository) {}

  async execute(id_status: number): Promise<Status | null> {
    return await this.statusRepository.getStatusById(id_status);
  }
}
