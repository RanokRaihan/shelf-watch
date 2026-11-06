"use client";

import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_TIMEZONE,
  PIN_LENGTH,
  TIMEZONES,
  registerSchema,
  type RegisterValues,
} from "@/lib/validations/register";

const defaultValues: RegisterValues = {
  storeName: "",
  location: "",
  timezone: DEFAULT_TIMEZONE,
  name: "",
  username: "",
  email: "",
  password: "",
  pin: "",
};

function handleRegister(values: RegisterValues) {
  console.log(values);
}

const CONTROL_SIZE = "h-12 px-3 text-base md:text-base";

function isFieldInvalid(field: AnyFieldApi) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}

type TextFieldProps = ComponentProps<"input"> & {
  field: AnyFieldApi;
  label: string;
  description?: string;
  fieldClassName?: string;
};

function TextField({
  field,
  label,
  description,
  fieldClassName,
  ...props
}: TextFieldProps) {
  const isInvalid = isFieldInvalid(field);

  return (
    <Field data-invalid={isInvalid} className={fieldClassName}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={isInvalid}
        className={CONTROL_SIZE}
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

type FormSectionProps = {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
};

// Stacked on phones. On desktop the heading sits beside a 2-column field grid.
function FormSection({ id, title, description, children }: FormSectionProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-8">
        <div className="flex flex-col gap-1">
          <h2 id={id} className="text-base font-medium">
            {title}
          </h2>
          <FieldDescription>{description}</FieldDescription>
        </div>
        <FieldSet aria-labelledby={id}>
          <FieldGroup className="lg:grid lg:grid-cols-2 lg:items-start">
            {children}
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>
  );
}

export function RegisterForm() {
  const form = useForm({
    defaultValues,
    validators: { onSubmit: registerSchema },
    onSubmit: ({ value }) => handleRegister(value),
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <FormSection
        id="store-info"
        title="Store info"
        description="The store your team will work in."
      >
        <form.Field name="storeName">
          {(field) => (
            <TextField
              field={field}
              label="Store name"
              fieldClassName="lg:col-span-2"
              autoComplete="organization"
            />
          )}
        </form.Field>
        <form.Field name="location">
          {(field) => (
            <TextField
              field={field}
              label="Location (optional)"
              placeholder="City or street address"
              autoComplete="off"
            />
          )}
        </form.Field>
        <form.Field name="timezone">
          {(field) => {
            const isInvalid = isFieldInvalid(field);

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Timezone</FieldLabel>
                <Select
                  name={field.name}
                  items={TIMEZONES}
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (value) field.handleChange(value);
                  }}
                >
                  <SelectTrigger
                    id={field.name}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                    className="w-full px-3 text-base data-[size=default]:h-12"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((timezone) => (
                      <SelectItem
                        key={timezone.value}
                        value={timezone.value}
                        className="min-h-10 text-base"
                      >
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            );
          }}
        </form.Field>
      </FormSection>

      <FormSection
        id="personal-info"
        title="Personal info"
        description="You'll be the manager of this store."
      >
        <form.Field name="name">
          {(field) => (
            <TextField field={field} label="Name" autoComplete="name" />
          )}
        </form.Field>
        <form.Field name="username">
          {(field) => (
            <TextField
              field={field}
              label="Username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          )}
        </form.Field>
        <form.Field name="email">
          {(field) => (
            <TextField
              field={field}
              label="Email (optional)"
              fieldClassName="lg:col-span-2"
              type="email"
              inputMode="email"
              autoComplete="email"
            />
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <TextField
              field={field}
              label="Password"
              type="password"
              autoComplete="new-password"
              description="At least 8 characters."
            />
          )}
        </form.Field>
        <form.Field name="pin">
          {(field) => (
            <TextField
              field={field}
              label="PIN"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_LENGTH}
              description={`${PIN_LENGTH} digits, for quick sign-in.`}
            />
          )}
        </form.Field>
      </FormSection>

      <Button type="submit" className="h-12 w-full text-base lg:w-auto lg:self-end lg:px-8">
        Create account
      </Button>
    </form>
  );
}
