import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from "@/components/ui/admin-layout";
import AdminPTDialog from "@/components/admin-pt-dialog";
import PageHeader from "@/components/layout/page-header";
import { useTrainers, useTrainerActions } from "@/hooks/useTrainers";
import { Plus, Edit, Trash2, DollarSign, Award } from "lucide-react";
import type { PersonalTrainer } from "@shared/schema.ts";
import { getErrorMessage } from "@/types/adminDialogs";

export default function AdminTrainers() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [showPTDialog, setShowPTDialog] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<PersonalTrainer | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
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

  const { data: dashboardData } = useQuery<{ stats?: { expiringSoon?: number } }>({
    queryKey: ["/api/admin/dashboard"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: trainers } = useTrainers(isAuthenticated && user?.role === 'admin');
  const { remove } = useTrainerActions();

  // Do not block rendering with a loading spinner; show cached UI.

  if (!user || user.role !== 'admin') {
    return null;
  }

  const stats = dashboardData?.stats || {};

  const handleAddTrainer = () => {
    setSelectedTrainer(null);
    setShowPTDialog(true);
  };

  const handleEditTrainer = (trainer: PersonalTrainer) => {
    setSelectedTrainer(trainer);
    setShowPTDialog(true);
  };

  const handleDeleteTrainer = async (trainerId: string) => {
    if (!confirm("Are you sure you want to delete this trainer?")) {
      return;
    }

    try {
      await remove.mutateAsync(trainerId);
      toast({
        title: "Success!",
        description: "Trainer has been deleted",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete trainer"),
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout user={user} notificationCount={stats.expiringSoon || 0}>
      <div className="space-y-6">
        <PageHeader
          title="Personal Trainers"
          subtitle="Manage personal trainers"
          actions={
            <Button
              className="gym-gradient text-white"
              onClick={handleAddTrainer}
              data-testid="button-add-trainer"
            >
              <Plus className="mr-2" size={16} />
              Add New Trainer
            </Button>
          }
        />

        {/* Trainers Grid */}
        {!trainers || trainers.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">No trainers available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map((trainer) => (
              <Card key={trainer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={trainer.imageUrl || undefined} />
                      <AvatarFallback className="text-lg">
                        {trainer.name?.[0] || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{trainer.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {trainer.specialization}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {trainer.bio || "No bio available"}
                  </p>

                  {trainer.experience && (
                    <div className="flex items-center gap-2 text-sm">
                      <Award size={16} className="text-muted-foreground" />
                      <span className="text-foreground">{trainer.experience} years experience</span>
                    </div>
                  )}

                  {trainer.certification && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Certification: </span>
                      <span className="text-foreground">{trainer.certification}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-lg font-bold text-foreground pt-2">
                    <DollarSign size={20} className="text-primary" />
                    <span>${trainer.pricePerSession}/session</span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditTrainer(trainer)}
                      data-testid={`button-edit-trainer-${trainer.id}`}
                    >
                      <Edit size={16} className="mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTrainer(trainer.id)}
                      data-testid={`button-delete-trainer-${trainer.id}`}
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

      {/* Trainer Dialog */}
      <AdminPTDialog
        open={showPTDialog}
        onOpenChange={setShowPTDialog}
        trainer={selectedTrainer}
      />
    </AdminLayout>
  );
}
