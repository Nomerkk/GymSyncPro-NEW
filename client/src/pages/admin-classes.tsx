import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminClassDialog from "@/components/admin-class-dialog";
import { Plus, Edit, Trash2, Users, Calendar } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { GymClass } from "@shared/schema.ts";
import PageHeader from "@/components/layout/page-header";
import { useClasses, useClassActions } from "@/hooks/useClasses";
import { getErrorMessage } from "@/lib/errors";
import { BranchBadge } from "@/components/ui/branch-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminDashboardData {
  stats?: {
    expiringSoon?: number;
  };
}

export default function AdminClasses() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
  const [branchFilter, setBranchFilter] = useState<string>("all");

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);



  const { data: gymClasses, refetch } = useClasses(isAuthenticated && isAdmin, branchFilter !== "all" ? branchFilter : undefined);
  const { remove } = useClassActions();

  // Do not block rendering with a loading spinner; rely on cached data.

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }



  const handleAddClass = () => {
    setSelectedClass(null);
    setShowClassDialog(true);
  };

  const handleEditClass = (gymClass: GymClass) => {
    setSelectedClass(gymClass);
    setShowClassDialog(true);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) {
      return;
    }

    try {
      await remove.mutateAsync(classId);
      toast({
        title: "Success!",
        description: "Class has been deleted",
      });
      refetch();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete class"),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Gym Classes"
          subtitle="Manage gym classes and schedules"
          actions={
            <Button
              className="gym-gradient text-white"
              onClick={handleAddClass}
              data-testid="button-add-class"
            >
              <Plus className="mr-2" size={16} />
              Add New Class
            </Button>
          }
        />

        {isSuperAdmin && (
          <div className="flex justify-end mb-4">
            <div className="w-full md:w-48">
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="Cikarang">Cikarang</SelectItem>
                  <SelectItem value="Jakarta Barat">Jakarta Barat</SelectItem>
                  <SelectItem value="Bandung">Bandung</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Classes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <AspectRatio ratio={16 / 9}>
                  <div className="w-full h-full bg-muted animate-pulse" />
                </AspectRatio>
                <CardHeader>
                  <div className="space-y-2">
                    <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !gymClasses || gymClasses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">No classes available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gymClasses.map((gymClass) => (
              <Card key={gymClass.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {gymClass.imageUrl && (
                  <AspectRatio ratio={16 / 9}>
                    <img src={gymClass.imageUrl} alt={gymClass.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </AspectRatio>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{gymClass.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {gymClass.instructorName}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={gymClass.active ? "default" : "secondary"}>
                        {gymClass.active ? "Active" : "Inactive"}
                      </Badge>
                      <BranchBadge branch={gymClass.branch} className="text-xs" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {gymClass.description || "No description"}
                  </p>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span className="text-foreground">{gymClass.schedule}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-muted-foreground" />
                    <span className="text-foreground">
                      {gymClass.currentEnrollment || 0} / {gymClass.maxCapacity} enrolled
                    </span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditClass(gymClass)}
                      data-testid={`button-edit-class-${gymClass.id}`}
                    >
                      <Edit size={16} className="mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClass(gymClass.id)}
                      data-testid={`button-delete-class-${gymClass.id}`}
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Class Dialog */}
      <AdminClassDialog
        open={showClassDialog}
        onOpenChange={setShowClassDialog}
        gymClass={selectedClass}
      />
    </>
  );
}
