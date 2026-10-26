import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { leadsApi } from '@/api/leads';
import { contactsApi } from '@/api/contacts';
import { dealsApi } from '@/api/deals';
import { tasksApi } from '@/api/tasks';
import { activityTimelineApi } from '@/api/activityTimeline';
import { useAuth } from '@/context/AuthContext';
import { DEAL_STAGES, LEAD_STATUS_CONFIG } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  DollarSign,
  TrendingUp,
  Target,
  Users,
  CheckSquare,
  Clock,
  Plus,
  ArrowRight,
  Layers,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, organizationName } = useAuth();

  // Queries
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: ['leads'],
    queryFn: leadsApi.listAllLeads,
  });

  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsApi.getByOwner,
  });

  const { data: deals = [], isLoading: isLoadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: dealsApi.getAllDeals,
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.listTasks,
  });

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => activityTimelineApi.getOrganizationFeed(0, 6),
  });

  // Calculate Metrics from real data
  const totalPipeline = useMemo(() => {
    return deals
      .filter((d) => d.stage !== 'CLOSED_LOST')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [deals]);

  const totalExpectedRevenue = useMemo(() => {
    return deals
      .filter((d) => d.stage !== 'CLOSED_LOST')
      .reduce((sum, d) => sum + (d.expectedRevenue || 0), 0);
  }, [deals]);

  const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);

  const tasksDueToday = useMemo(() => {
    return tasks.filter((t) => t.dueDate === todayStr && t.status !== 'COMPLETED');
  }, [tasks, todayStr]);

  const completedTasksCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'COMPLETED').length;
  }, [tasks]);

  const taskCompletionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((completedTasksCount / tasks.length) * 100);
  }, [tasks, completedTasksCount]);

  // Lead status breakdown chart data
  const leadStatusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      counts[l.leadStatus] = (counts[l.leadStatus] || 0) + 1;
    });
    const colors: Record<string, string> = {
      NEW: '#3b82f6',
      CONTACTED: '#f59e0b',
      QUALIFIED: '#8b5cf6',
      LOST: '#71717a',
      CONVERTED: '#10b981',
    };
    return Object.entries(counts).map(([status, count]) => ({
      name: LEAD_STATUS_CONFIG[status as keyof typeof LEAD_STATUS_CONFIG]?.label || status,
      value: count,
      color: colors[status] || '#6366f1',
    }));
  }, [leads]);

  // Deal stage pipeline chart data
  const dealStageChartData = useMemo(() => {
    return DEAL_STAGES.map((s) => {
      const stageDeals = deals.filter((d) => d.stage === s.id);
      const totalAmount = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
      return {
        stage: s.label,
        count: stageDeals.length,
        value: totalAmount,
      };
    });
  }, [deals]);

  const isLoadingMetrics = isLoadingLeads || isLoadingContacts || isLoadingDeals || isLoadingTasks;

  return (
    <div className="space-y-6">
      {/* Top Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Good day, {user?.firstName || 'Sales Leader'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here is your sales performance overview for {organizationName || 'your workspace'}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/leads?action=new')}
            className="text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lead</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/deals?action=new')}
            className="text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deal</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/tasks?action=new')}
            className="text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Task</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/contacts?action=new')}
            className="text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Contact</span>
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Pipeline
              </p>
              {isLoadingMetrics ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(totalPipeline)}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {deals.filter((d) => d.stage !== 'CLOSED_LOST').length} active deals
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Expected Revenue */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Expected Revenue
              </p>
              {isLoadingMetrics ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(totalExpectedRevenue)}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Weighted by win probability
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Qualified Leads */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Leads
              </p>
              {isLoadingMetrics ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground mt-1">
                  {leads.length}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {leads.filter((l) => l.leadStatus === 'QUALIFIED').length} qualified prospects
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Target className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Task Completion Rate */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tasks Due Today
              </p>
              {isLoadingMetrics ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground mt-1">
                  {tasksDueToday.length}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {taskCompletionRate}% completion rate
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CheckSquare className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Stage Pipeline Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Pipeline Stage Value</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/deals')}
              className="text-xs h-7 gap-1"
            >
              <span>Board</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
                No active deals recorded in pipeline
              </div>
            ) : (
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealStageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <XAxis
                      dataKey="stage"
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value)), 'Total Value']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--foreground)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Status Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span>Lead Qualification Breakdown</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/leads')}
              className="text-xs h-7 gap-1"
            >
              <span>View Leads</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
                No leads recorded yet
              </div>
            ) : (
              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadStatusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {leadStatusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--foreground)',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Due Tasks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Tasks Requiring Attention</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tasks')}
              className="text-xs h-7 gap-1"
            >
              <span>All Tasks</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No tasks scheduled in your workspace.
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => navigate('/tasks')}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-primary/50 bg-card transition-all cursor-pointer"
                  >
                    <div className="truncate mr-3">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {t.subject}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Due {formatDate(t.dueDate)}</span>
                        {t.owner && <span>• {t.owner.firstName} {t.owner.lastName}</span>}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Organization Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span>Workspace Audit Trail</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/activity')}
              className="text-xs h-7 gap-1"
            >
              <span>Full Feed</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              activities={activityData?.content || []}
              isLoading={isLoadingActivity}
              emptyMessage="No activity events recorded yet"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
