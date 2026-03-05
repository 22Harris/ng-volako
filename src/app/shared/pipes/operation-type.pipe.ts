import { Pipe, PipeTransform } from '@angular/core';
import { OperationType } from '../../core/models/operation.model';
import { OPERATION_TYPE_CONFIG, OperationTypeConfig } from '../../core/utils/operation-type.utils';

@Pipe({ name: 'operationType', standalone: true })
export class OperationTypePipe implements PipeTransform {
  transform(type: OperationType, field: keyof OperationTypeConfig = 'label'): string {
    return OPERATION_TYPE_CONFIG[type]?.[field] as string ?? type;
  }
}
