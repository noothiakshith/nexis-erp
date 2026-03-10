import React from "react";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CreateEmployeeModal } from "@/components/HR/CreateEmployeeModal";
import { CreateLeaveModal } from "@/components/HR/CreateLeaveModal";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HR() {
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = React.useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = React.useState(false);

  // Real data fetching
  const { data: employees, refetch } = trpc.employee.listAll.useQuery();

  const activeCount = employees?.filter(e => e.status === "active").length || 0;
  const payrollTotal = employees?.reduce((sum, e) => sum + parseFloat(e.salary || "0"), 0) || 0;

  const { data: leaves, refetch: refetchLeaves } = trpc.employee.getLeaves.useQuery();

  return (
    <ERPDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Human Resources
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage personnel, departments and payroll</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsLeaveModalOpen(true)}
              variant="outline"
              className="border-slate-200 hover:bg-slate-50 shadow-sm transition-transform active:scale-95 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Request Leave
            </Button>
            <Button
              onClick={() => setIsEmployeeModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-transform active:scale-95"
            >
              Add Employee
            </Button>
          </div>
        </div>

        <Tabs defaultValue="directory" className="space-y-6">
          <TabsList className="bg-slate-100/50 p-1 border border-slate-200">
            <TabsTrigger value="directory" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Directory
            </TabsTrigger>
            <TabsTrigger value="leaves" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Leave Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directory">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{employees?.length || 0}</div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600 uppercase tracking-wider">Active Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">{activeCount}</div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-600 uppercase tracking-wider">Monthly Payroll</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-700">${((payrollTotal || 0) / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                <CardTitle>Employee Directory</CardTitle>
                <Badge variant="outline" className="font-normal">{employees?.length || 0} members</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {employees && employees.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Employee</th>
                          <th className="px-6 py-4">Department</th>
                          <th className="px-6 py-4">Position</th>
                          <th className="px-6 py-4 text-right">Join Date</th>
                          <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {employees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</span>
                                  <span className="text-xs text-slate-400">{emp.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm">
                              {emp.department}
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm font-medium">
                              {emp.position}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs text-right">
                              {new Date(emp.joinDate!).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {emp.status === "active" ? (
                                <Badge className="bg-green-100 text-green-700 border-none hover:bg-green-200">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                                  {emp.status}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400 bg-slate-50/20">
                    <div className="mb-2 text-2xl">👥</div>
                    <p>No employees found. Add your first employee!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaves">
            <Card className="border-none shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                <CardTitle>Leave Requests</CardTitle>
                <Badge variant="outline" className="font-normal">{leaves?.length || 0} requests</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {leaves && leaves.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Employee</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Period</th>
                          <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leaves.map((leave) => {
                          const emp = employees?.find(e => e.id === leave.employeeId);
                          return (
                            <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <span className="font-semibold text-slate-900">{emp ? `${emp.firstName} ${emp.lastName}` : `ID ${leave.employeeId}`}</span>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="secondary" className="capitalize">{leave.leaveType}</Badge>
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs">
                                {new Date(leave.startDate!).toLocaleDateString()} to {new Date(leave.endDate!).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge className={`${leave.status === "approved" ? "bg-green-100 text-green-700" :
                                  leave.status === "rejected" ? "bg-red-100 text-red-700" :
                                    "bg-yellow-100 text-yellow-700"
                                  } border-none`}>
                                  {leave.status}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400 bg-slate-50/20">
                    <div className="mb-2 text-2xl">🌴</div>
                    <p>No leave requests found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CreateEmployeeModal
          open={isEmployeeModalOpen}
          onOpenChange={setIsEmployeeModalOpen}
          onSuccess={refetch}
        />

        <CreateLeaveModal
          open={isLeaveModalOpen}
          onOpenChange={setIsLeaveModalOpen}
          onSuccess={refetchLeaves}
        />
      </div>
    </ERPDashboardLayout>
  );
}
