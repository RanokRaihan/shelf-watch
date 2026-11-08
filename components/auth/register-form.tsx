"use client";

import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { cn } from "cn";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState, type ComponentProps, type ReactNode } from "react";

import { registerAction } from "@/actions/register.action";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toFormErrors } from "@/lib/action-result";
import type { RegisteredManager } from "@/lib/register";
import {
  DEFAULT_TIMEZONE,
  PIN_LENGTH,
  TIMEZONES,
  registerSchema,
  type RegisterValues,
} from "@/lib/validations/register.validation";

const defaultValues: RegisterValues = {
  storeName: "",
  location: "",
  timezone: DEFAULT_TIMEZONE,
  name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  pin: "",
  confirmPin: "",
};

const CONTROL_SIZE = "h-12 px-3 text-base md:text-base";

function isFieldInvalid(field: AnyFieldApi) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}

// Zod errors arrive as `{ message }`, server errors as plain strings.
function toFieldErrors(errors: unknown[]) {
  return errors.map((error) =>
    typeof error === "string" ? { message: error } : (error as { message?: string }),
  );
}

type TextFieldProps = ComponentProps<"input"> & {
  field: AnyFieldApi;
  label: string;
  description?: string;
  fieldClassName?: string;
  /** Adds an eye button that shows or hides the value (for `type="password"`). */
  revealable?: boolean;
};

function TextField({
  field,
  label,
  description,
  fieldClassName,
  revealable = false,
  type,
  ...props
}: TextFieldProps) {
  const isInvalid = isFieldInvalid(field);
  const [isRevealed, setIsRevealed] = useState(false);

  const input = (
    <Input
      id={field.name}
      name={field.name}
      value={field.state.value}
      onBlur={field.handleBlur}
      onChange={(event) => field.handleChange(event.target.value)}
      aria-invalid={isInvalid}
      className={cn(CONTROL_SIZE, revealable && "pr-12")}
      type={revealable && isRevealed ? "text" : type}
      {...props}
    />
  );

  return (
    <Field data-invalid={isInvalid} className={fieldClassName}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {revealable ? (
        <div className="relative">
          {input}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsRevealed((revealed) => !revealed)}
            aria-label={`${isRevealed ? "Hide" : "Show"} ${label.toLowerCase()}`}
            aria-pressed={isRevealed}
            aria-controls={field.name}
            className="absolute inset-y-0 right-0 h-12 w-12 text-muted-foreground"
          >
            {isRevealed ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </Button>
        </div>
      ) : (
        input
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={toFieldErrors(field.state.meta.errors)} />}
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

// Temporary: shown after signup until sessions exist, then we redirect instead.
function RegisterSuccess({ storeName, username }: RegisteredManager) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Your store is ready</CardTitle>
        <CardDescription className="text-base">
          {storeName} is set up, and you&apos;re its manager.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-base">
        Your username is <span className="font-medium">{username}</span>.
      </CardContent>
      <CardFooter>
        <Link
          href="/"
          className={buttonVariants({ className: "h-12 w-full text-base lg:w-auto lg:px-8" })}
        >
          Go to home
        </Link>
      </CardFooter>
    </Card>
  );
}

export function RegisterForm() {
  const [registered, setRegistered] = useState<RegisteredManager | null>(null);

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: registerSchema,
      // Runs only after the Zod check above passes.
      onSubmitAsync: async ({ value }) => {
        const result = await registerAction(value);
        if (!result.ok) return toFormErrors(result);
        setRegistered(result.data);
        return undefined;
      },
    },
  });

  if (registered) return <RegisterSuccess {...registered} />;

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
                  <FieldError errors={toFieldErrors(field.state.meta.errors)} />
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
              description="Saved in lowercase."
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
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
            />
          )}
        </form.Field>
        <form.Field name="phone">
          {(field) => (
            <TextField
              field={field}
              label="Phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(215) 555-1234"
            />
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <TextField
              field={field}
              label="Password"
              type="password"
              revealable
              autoComplete="new-password"
              description="At least 8 characters."
            />
          )}
        </form.Field>
        <form.Field
          name="confirmPassword"
          validators={{
            // Check on blur, and again when Password is blurred, so a changed
            // password is caught. Empty is left to the submit check.
            onBlurListenTo: ["password"],
            onBlur: ({ value, fieldApi }) =>
              value && value !== fieldApi.form.getFieldValue("password")
                ? "Passwords don't match"
                : undefined,
          }}
        >
          {(field) => (
            <TextField
              field={field}
              label="Confirm password"
              type="password"
              revealable
              autoComplete="new-password"
            />
          )}
        </form.Field>
        <form.Field name="pin">
          {(field) => (
            <TextField
              field={field}
              label="PIN"
              type="password"
              revealable
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_LENGTH}
              description={`${PIN_LENGTH} digits, for quick sign-in.`}
            />
          )}
        </form.Field>
        <form.Field
          name="confirmPin"
          validators={{
            // Same as Confirm password: check on blur, and again when PIN is
            // blurred. Empty is left to the submit check.
            onBlurListenTo: ["pin"],
            onBlur: ({ value, fieldApi }) =>
              value && value !== fieldApi.form.getFieldValue("pin")
                ? "PINs don't match"
                : undefined,
          }}
        >
          {(field) => (
            <TextField
              field={field}
              label="Confirm PIN"
              type="password"
              revealable
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_LENGTH}
            />
          )}
        </form.Field>
      </FormSection>

      <form.Subscribe
        selector={(state) => ({
          formError: state.errorMap.onSubmit,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ formError, isSubmitting }) => (
          <div className="flex flex-col gap-3 lg:items-end">
            {typeof formError === "string" && (
              <FieldError className="text-base">{formError}</FieldError>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full text-base lg:w-auto lg:px-8"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
