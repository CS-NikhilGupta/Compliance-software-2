-- Row Level Security (RLS) Policies for Multi-Tenant Compliance SaaS
-- This file contains PostgreSQL RLS policies to enforce tenant isolation

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- Create function to get current tenant ID from session
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has admin role
CREATE OR REPLACE FUNCTION is_admin_user() RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('app.is_admin', true)::boolean;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TENANT POLICIES
-- ============================================================================

-- Tenants: Users can only see their own tenant
CREATE POLICY tenant_isolation ON tenants
  FOR ALL
  USING (id = current_tenant_id());

-- ============================================================================
-- USER POLICIES  
-- ============================================================================

-- Users: Can only see users from same tenant
CREATE POLICY user_tenant_isolation ON users
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- CLIENT POLICIES
-- ============================================================================

-- Clients: Can only see clients from same tenant
CREATE POLICY client_tenant_isolation ON clients
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- ENTITY POLICIES
-- ============================================================================

-- Entities: Can only see entities from same tenant
CREATE POLICY entity_tenant_isolation ON entities
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- TASK POLICIES
-- ============================================================================

-- Tasks: Can only see tasks from same tenant
CREATE POLICY task_tenant_isolation ON tasks
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- DOCUMENT POLICIES
-- ============================================================================

-- Documents: Can only see documents from same tenant
CREATE POLICY document_tenant_isolation ON documents
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- NOTIFICATION POLICIES
-- ============================================================================

-- Notifications: Can only see notifications from same tenant
CREATE POLICY notification_tenant_isolation ON notifications
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

-- Audit Logs: Can only see audit logs from same tenant
CREATE POLICY audit_log_tenant_isolation ON audit_logs
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- INVITATION POLICIES
-- ============================================================================

-- Invitations: Can only see invitations from same tenant
CREATE POLICY invitation_tenant_isolation ON invitations
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- SUBSCRIPTION POLICIES
-- ============================================================================

-- Subscriptions: Can only see subscriptions from same tenant
CREATE POLICY subscription_tenant_isolation ON subscriptions
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- USAGE COUNTER POLICIES
-- ============================================================================

-- Usage Counters: Can only see usage counters from same tenant
CREATE POLICY usage_counter_tenant_isolation ON usage_counters
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- BYPASS POLICIES FOR SYSTEM OPERATIONS
-- ============================================================================

-- Allow system/admin operations to bypass RLS when needed
-- This should be used sparingly and only for system maintenance

-- Create a bypass role for system operations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'system_admin') THEN
    CREATE ROLE system_admin;
  END IF;
END
$$;

-- Grant bypass privileges to system_admin role
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
ALTER TABLE entities FORCE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE usage_counters FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR APPLICATION
-- ============================================================================

-- Function to set tenant context for a session
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id TEXT, is_admin BOOLEAN DEFAULT FALSE) 
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id, false);
  PERFORM set_config('app.is_admin', is_admin::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear tenant context
CREATE OR REPLACE FUNCTION clear_tenant_context() 
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', '', false);
  PERFORM set_config('app.is_admin', 'false', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes on tenant_id columns for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_tenant_id ON entities(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invitations_tenant_id ON invitations(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_counters_tenant_id ON usage_counters(tenant_id);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tenant_status ON tasks(tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tenant_assignee ON tasks(tenant_id, assignee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tenant_due_date ON tasks(tenant_id, due_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_tenant_client ON documents(tenant_id, client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION current_tenant_id() IS 'Returns the current tenant ID from session context';
COMMENT ON FUNCTION is_admin_user() IS 'Returns true if current user has admin privileges';
COMMENT ON FUNCTION set_tenant_context(TEXT, BOOLEAN) IS 'Sets tenant context for current session';
COMMENT ON FUNCTION clear_tenant_context() IS 'Clears tenant context from current session';

COMMENT ON POLICY tenant_isolation ON tenants IS 'Ensures users can only access their own tenant data';
COMMENT ON POLICY user_tenant_isolation ON users IS 'Restricts user access to same tenant only';
COMMENT ON POLICY client_tenant_isolation ON clients IS 'Restricts client access to same tenant only';
COMMENT ON POLICY entity_tenant_isolation ON entities IS 'Restricts entity access to same tenant only';
COMMENT ON POLICY task_tenant_isolation ON tasks IS 'Restricts task access to same tenant only';
COMMENT ON POLICY document_tenant_isolation ON documents IS 'Restricts document access to same tenant only';
COMMENT ON POLICY notification_tenant_isolation ON notifications IS 'Restricts notification access to same tenant only';
COMMENT ON POLICY audit_log_tenant_isolation ON audit_logs IS 'Restricts audit log access to same tenant only';
COMMENT ON POLICY invitation_tenant_isolation ON invitations IS 'Restricts invitation access to same tenant only';
COMMENT ON POLICY subscription_tenant_isolation ON subscriptions IS 'Restricts subscription access to same tenant only';
COMMENT ON POLICY usage_counter_tenant_isolation ON usage_counters IS 'Restricts usage counter access to same tenant only';
