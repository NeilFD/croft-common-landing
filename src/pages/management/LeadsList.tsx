import { useState } from 'react';
import { format } from 'date-fns';
import { Search, Filter, MoreHorizontal, Plus, Users, Mail, Calendar, Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useLeads, type LeadWithSpace } from '@/hooks/useLeads';
import { useSpaces } from '@/hooks/useSpaces';
import { Link, useNavigate } from 'react-router-dom';
import { ManagementLayout } from '@/components/management/ManagementLayout';

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  qualified: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  proposed: 'bg-purple-100 text-purple-800 border-purple-200',
  won: 'bg-green-100 text-green-800 border-green-200',
  lost: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function LeadsList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: '',
    owner_id: '',
    space_id: '',
    search: '',
    date_from: '',
    date_to: '',
  });
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const { data: leads, isLoading } = useLeads(filters);
  const { data: spaces } = useSpaces();

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" values to empty strings for the API
    const apiValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: apiValue }));
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    setSelectedLeads(prev => 
      checked 
        ? [...prev, leadId]
        : prev.filter(id => id !== leadId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedLeads(checked ? (leads?.map(lead => lead.id) || []) : []);
  };

  const formatBudget = (low?: number | null, high?: number | null) => {
    if (!low && !high) return '-';
    if (low && high) return `£${low.toLocaleString()} - £${high.toLocaleString()}`;
    if (low) return `£${low.toLocaleString()}+`;
    if (high) return `Up to £${high.toLocaleString()}`;
    return '-';
  };

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <Button onClick={() => navigate('/management/spaces/leads/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Loading leads...</div>
            </CardContent>
          </Card>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div className="space-y-6">
        {/* Header with Back Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/management/spaces" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Spaces</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leads & Sales</h1>
              <p className="text-muted-foreground">
                Manage enquiries and track your sales pipeline
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/management/spaces/leads/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads?.filter(l => l.status === 'new').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads?.filter(l => l.status === 'qualified').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads?.filter(l => l.status === 'won').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposed">Proposed</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.space_id || 'all'} onValueChange={(value) => handleFilterChange('space_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Spaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Spaces</SelectItem>
                {spaces?.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />

            <Input
              type="date"
              placeholder="To date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedLeads.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedLeads.length} lead{selectedLeads.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Change Status
                </Button>
                <Button variant="outline" size="sm">
                  Reassign Owner
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({leads?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === leads?.length && leads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Space</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Headcount</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <Link 
                          to={`/management/spaces/leads/${lead.id}`}
                          className="font-medium hover:underline"
                        >
                          {lead.first_name} {lead.last_name}
                        </Link>
                        <div className="text-sm text-muted-foreground">{lead.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={STATUS_COLORS[lead.status]}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.owner_id ? (
                        <div className="text-sm">Owner Name</div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.space?.name || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {lead.preferred_date ? (
                        format(new Date(lead.preferred_date), 'dd MMM yyyy')
                      ) : (
                        <span className="text-muted-foreground">
                          {lead.date_flexible ? 'Flexible' : '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.headcount || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatBudget(lead.budget_low, lead.budget_high)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(lead.created_at), 'dd MMM yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg">
                          <DropdownMenuItem asChild>
                            <Link to={`/management/spaces/leads/${lead.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <a href={`mailto:${lead.email}`}>Send Email</a>
                          </DropdownMenuItem>
                          {lead.phone && (
                            <DropdownMenuItem>
                              <a href={`tel:${lead.phone}`}>Call</a>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {leads?.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  No leads found. Adjust your filters or check back later.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  </ManagementLayout>
);
}