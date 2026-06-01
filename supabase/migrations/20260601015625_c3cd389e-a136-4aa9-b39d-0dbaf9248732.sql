-- Allow admins to moderate (delete) any review
CREATE POLICY "Admins can delete any review"
ON public.reviews
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete launch leads (cleanup)
CREATE POLICY "Admins can delete launch leads"
ON public.leads_lanzamiento
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));