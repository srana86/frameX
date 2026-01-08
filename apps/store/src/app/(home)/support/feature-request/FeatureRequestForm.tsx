"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitFeatureRequest } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState = { success: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type='submit' className='w-full sm:w-auto' disabled={pending}>
      {pending ? "Sending..." : "Submit Request"}
    </Button>
  );
}

export function FeatureRequestForm() {
  const [state, formAction] = useFormState(submitFeatureRequest, initialState);

  return (
    <Card className='shadow-sm'>
      <CardHeader>
        <CardTitle>Request a Feature</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {state.message && (
          <Alert variant={state.success ? "default" : "destructive"}>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Title *</Label>
            <Input id='title' name='title' required placeholder='Short title' />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description *</Label>
            <Textarea id='description' name='description' required placeholder='Tell us what you need and why' rows={4} />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Priority</Label>
              <Select name='priority' defaultValue='medium'>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='low'>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='contactEmail'>Contact Email</Label>
              <Input id='contactEmail' name='contactEmail' type='email' placeholder='you@example.com' />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='contactPhone'>Contact Phone</Label>
            <Input id='contactPhone' name='contactPhone' placeholder='+123456789' />
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
