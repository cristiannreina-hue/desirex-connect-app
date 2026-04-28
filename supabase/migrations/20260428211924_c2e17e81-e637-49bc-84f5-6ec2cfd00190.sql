CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));