# Multi-Step Approval Workflows System

## Overview

The Multi-Step Approval Workflows system provides a comprehensive solution for managing complex approval processes across different ERP modules. It supports sophisticated routing logic, email notifications, audit trails, and flexible workflow configurations.

## Features Implemented

### 1. Database Schema
- **Approvals Table**: Core approval workflow tracking
- **Approval Steps Table**: Individual steps within each workflow
- **Approval Audit Table**: Complete audit trail of all actions
- **Email Logs Table**: Email notification tracking

### 2. Workflow Types Supported
- **Purchase Orders**: Department Manager → Finance Manager → Executive
- **Leave Requests**: Direct Manager → HR Manager → Executive (for extended leave)
- **Expense Reports**: Department Manager → Finance Manager → Executive

### 3. Rules Engine (`server/_core/approvalRules.ts`)
- Dynamic workflow generation based on request data
- Conditional step requirements (amount thresholds, leave duration, etc.)
- Automatic approver assignment based on organizational hierarchy
- Custom approval rules for special scenarios

### 4. Email Notification System (`server/_core/emailService.ts`)
- Template-based email notifications
- Approval pending notifications
- Approval/rejection confirmations
- Bulk email support with retry logic

### 5. Frontend Components
- **Approval Dashboard** (`client/src/pages/Approvals.tsx`)
- **Workflow Status Tracker** (`client/src/components/ApprovalWorkflowStatus.tsx`)
- **Audit Log Viewer** (`client/src/components/ApprovalAuditLog.tsx`)

## Workflow Process

### 1. Workflow Creation
```typescript
// Automatic workflow creation when submitting requests
const approvalSteps = await getApprovalWorkflow("purchase_order", requestData, userId);
```

### 2. Step Processing
- Sequential step execution
- Automatic progression to next step on approval
- Workflow termination on rejection
- Email notifications at each step

### 3. Audit Trail
- Complete action logging
- IP address tracking
- Detailed change history
- Performance analytics

## API Endpoints

### Core Approval Operations
- `approvals.createApproval` - Create new approval workflow
- `approvals.getPendingApprovals` - Get user's pending approvals
- `approvals.getApprovalDetails` - Get detailed workflow information
- `approvals.approveStep` - Approve a workflow step
- `approvals.rejectApproval` - Reject an approval request
- `approvals.getApprovalHistory` - Get approval history for requests
- `approvals.getApprovalStats` - Get dashboard statistics

### Integration Points
- Purchase Order creation with approval routing
- Leave request submission with manager assignment
- Expense report submission with multi-level approval

## Configuration

### Approval Rules Configuration
```typescript
// Purchase Order Rules
{
  requestType: "purchase_order",
  steps: [
    {
      stepNumber: 1,
      approverRole: "department_manager",
      requiredCondition: (data) => data.totalAmount > 0,
    },
    {
      stepNumber: 2,
      approverRole: "finance_manager", 
      requiredCondition: (data) => data.totalAmount > 1000,
    },
    {
      stepNumber: 3,
      approverRole: "executive",
      requiredCondition: (data) => data.totalAmount > 10000,
    },
  ],
}
```

### Email Templates
```typescript
const emailTemplates = {
  po_pending_approval: {
    subject: "Purchase Order Pending Your Approval",
    template: (data) => `...`,
  },
  // Additional templates for different scenarios
};
```

## Security Features

### Access Control
- Role-based approval permissions
- User assignment validation
- Step-by-step authorization checks

### Audit Trail
- Complete action logging with timestamps
- IP address tracking
- User identification for all actions
- Immutable audit records

## Performance Optimizations

### Database Queries
- Efficient joins for approval data retrieval
- Indexed queries for pending approvals
- Optimized audit log queries

### Caching Strategy
- Approval statistics caching
- User role caching for approver assignment
- Template caching for email generation

## Testing

### Comprehensive Test Suite
- Unit tests for all approval operations
- Multi-step workflow integration tests
- Error handling and edge case testing
- Performance testing for large approval volumes

### Test Coverage
- Approval creation and routing
- Step approval and rejection
- Multi-step workflow completion
- Email notification delivery
- Audit trail accuracy

## Usage Examples

### Creating a Purchase Order with Approval
```typescript
// 1. Create purchase order
const po = await createPurchaseOrder({
  poNumber: "PO-2024-001",
  supplierId: 1,
  totalAmount: 15000,
  status: "pending_approval"
});

// 2. Automatic approval workflow creation
// - Department Manager (Step 1)
// - Finance Manager (Step 2) 
// - Executive (Step 3) - due to amount > $10,000
```

### Approving a Request
```typescript
// Manager reviews and approves
await approveStep({
  approvalId: 123,
  stepId: 456,
  comments: "Budget approved, proceed with purchase"
});

// Automatic progression to next step
// Email notification sent to next approver
```

### Rejecting a Request
```typescript
// Manager rejects with reason
await rejectApproval({
  approvalId: 123,
  stepId: 456,
  rejectionReason: "Insufficient budget allocation for Q4"
});

// Workflow terminated
// Rejection notification sent to requestor
```

## Dashboard Features

### Approval Statistics
- Total pending approvals
- Breakdown by request type
- Daily approval metrics
- Performance indicators

### Priority Management
- Age-based prioritization
- Visual priority indicators
- Overdue approval alerts
- Escalation notifications

### Filtering and Search
- Filter by request type
- Search by request ID
- Date range filtering
- Status-based filtering

## Future Enhancements

### Planned Features
1. **Parallel Approval Steps** - Multiple approvers for single step
2. **Conditional Routing** - Dynamic routing based on complex conditions
3. **Approval Delegation** - Temporary delegation during absence
4. **Mobile Notifications** - Push notifications for mobile apps
5. **Integration APIs** - External system integration
6. **Advanced Analytics** - Workflow performance analytics
7. **Custom Workflows** - User-configurable approval workflows

### Scalability Improvements
1. **Microservice Architecture** - Separate approval service
2. **Event-Driven Processing** - Asynchronous workflow processing
3. **Caching Layer** - Redis-based caching for performance
4. **Load Balancing** - Distributed approval processing

## Deployment Notes

### Environment Variables
```bash
FRONTEND_URL=http://localhost:3000  # For email links
EMAIL_SERVICE_API_KEY=your_key     # Email service integration
NOTIFICATION_WEBHOOK_URL=your_url  # Webhook notifications
```

### Database Migrations
- Run approval workflow migrations
- Update existing requests with approval status
- Create indexes for performance optimization

### Monitoring
- Approval processing metrics
- Email delivery success rates
- Workflow completion times
- Error rate monitoring

This comprehensive approval workflow system provides enterprise-grade functionality with flexibility, security, and scalability built-in from the ground up.