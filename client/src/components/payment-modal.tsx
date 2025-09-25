import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { CreditCard, Lock, X } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState("premium");

  const { data: membershipPlans } = useQuery({
    queryKey: ["/api/membership-plans"],
    enabled: isOpen,
  });

  const handleProceedToPayment = () => {
    // Navigate to checkout page with selected plan
    setLocation(`/checkout?plan=${selectedPlan}`);
    onClose();
  };

  const plans = membershipPlans || [
    { id: "basic", name: "Basic Plan", description: "Gym access only", price: "49.00" },
    { id: "premium", name: "Premium Plan", description: "Gym access + All classes", price: "99.00" },
    { id: "elite", name: "Elite Plan", description: "All access + Personal training", price: "149.00" },
  ];

  const selectedPlanData = plans.find((plan: any) => plan.id === selectedPlan);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-payment">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Renew Membership</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-payment-modal">
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Plan Selection */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-3 block">Select Plan</Label>
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              <div className="space-y-3">
                {plans.map((plan: any) => (
                  <div key={plan.id}>
                    <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                    <Label
                      htmlFor={plan.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                        selectedPlan === plan.id ? 'border-primary bg-primary/5 border-2' : 'border-border'
                      }`}
                      data-testid={`option-plan-${plan.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-foreground">{plan.name}</span>
                          <span className="font-bold text-foreground">${plan.price}/mo</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Payment Method Info */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-3 block">Payment Method</Label>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <CreditCard className="text-primary" size={20} />
                  <span className="font-medium text-foreground">Secure Payment with Stripe</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to our secure payment page to complete your purchase.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Total */}
          <Card className="bg-muted">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground" data-testid="text-payment-total">
                  ${selectedPlanData?.price || "0.00"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Recurring monthly charge</p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleProceedToPayment}
              className="flex-1 success-gradient text-white"
              data-testid="button-proceed-payment"
            >
              <Lock size={16} className="mr-2" />
              Proceed to Payment
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
