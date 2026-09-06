import { SetMetadata } from '@nestjs/common';

export const SKIP_APPROVAL_KEY = 'skipApprovalCheck';
export const SkipApprovalCheck = () => SetMetadata(SKIP_APPROVAL_KEY, true);
