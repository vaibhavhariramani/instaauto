import { MessageStatus } from '@instaauto/shared';
import { Badge, type BadgeProps } from '@/components/ui/badge';

const STATUS_VARIANT: Record<MessageStatus, BadgeProps['variant']> = {
  [MessageStatus.PENDING]: 'secondary',
  [MessageStatus.SENT]: 'default',
  [MessageStatus.DELIVERED]: 'success',
  [MessageStatus.FAILED]: 'destructive',
  [MessageStatus.RETRYING]: 'warning',
};

const STATUS_LABEL: Record<MessageStatus, string> = {
  [MessageStatus.PENDING]: 'Pending',
  [MessageStatus.SENT]: 'Sent',
  [MessageStatus.DELIVERED]: 'Delivered',
  [MessageStatus.FAILED]: 'Failed',
  [MessageStatus.RETRYING]: 'Retrying',
};

export function MessageStatusBadge({ status }: { status: MessageStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
