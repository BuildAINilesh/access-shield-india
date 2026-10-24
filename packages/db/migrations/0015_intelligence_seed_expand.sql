-- Expand AN Intelligence seed catalog (AN-F004 Phase 2)

INSERT INTO "a11y_package_issues" ("an_id", "package_name", "title", "issue_type", "severity", "at_affected", "description", "fix_status", "workaround")
VALUES
  ('AN-CHAKRA-002', '@chakra-ui/react', 'Modal close button unlabeled in some theme overrides', 'name', 'medium', ARRAY['NVDA+Chrome','VoiceOver+Safari'], 'Custom closeIcon without aria-label hides the dismiss control from screen readers.', 'open', 'Pass aria-label="Close" on ModalCloseButton or ensure the icon has an accessible name.'),
  ('AN-RADIX-001', '@radix-ui/react-dropdown-menu', 'Submenu trigger not announced as having submenu', 'name', 'medium', ARRAY['VoiceOver+Safari'], 'Nested DropdownMenu.Sub triggers may omit aria-haspopup/aria-expanded in older versions.', 'fixed', 'Upgrade @radix-ui/react-dropdown-menu to latest; verify SubTrigger exposes expanded state.'),
  ('AN-HEADLESS-001', '@headlessui/react', 'Listbox options not associated when virtualized', 'keyboard', 'high', ARRAY['NVDA+Chrome'], 'Virtualized Listbox can drop active-descendant wiring so arrow keys move focus without announcement.', 'open', 'Avoid virtualization for short lists or use the Combobox pattern with explicit aria-activedescendant.'),
  ('AN-NEXTUI-001', '@nextui-org/react', 'Checkbox group legend missing when using custom slot', 'name', 'medium', ARRAY['JAWS+Chrome'], 'Custom CheckboxGroup slots sometimes omit a visible/accessible group name.', 'open', 'Provide a legend or aria-labelledby pointing at a visible group heading.'),
  ('AN-TOAST-001', 'react-hot-toast', 'Toast region not announced as assertive by default', 'live', 'low', ARRAY['NVDA+Chrome'], 'Default toast container uses polite live region; urgent errors may be delayed.', 'open', 'Use a dedicated assertive live region for critical error toasts.'),
  ('AN-SWIPER-001', 'swiper', 'Pagination bullets lack accessible names', 'name', 'high', ARRAY['VoiceOver+Safari','NVDA+Firefox'], 'Default bullet pagination exposes empty buttons for slide positions.', 'open', 'Set pagination.renderBullet to include aria-label like "Go to slide N".'),
  ('AN-CHARTJS-001', 'chart.js', 'Canvas chart has no text alternative by default', 'name', 'high', ARRAY['NVDA+Chrome','JAWS+Chrome'], 'Charts rendered to canvas omit a data table or aria description unless configured.', 'open', 'Provide a linked HTML table summary or set aria-label/aria-describedby with key insights.'),
  ('AN-RECHARTS-001', 'recharts', 'Legend items not keyboard focusable', 'keyboard', 'medium', ARRAY['NVDA+Chrome'], 'Default legend relies on hover; keyboard users cannot toggle series.', 'open', 'Add custom legend with buttons and onClick handlers for series toggle.'),
  ('AN-TIPPY-001', '@tippyjs/react', 'Tooltip content not hoverable / focusable in older builds', 'focus', 'medium', ARRAY['VoiceOver+Safari'], 'Interactive tippy content can disappear before screen reader users reach it.', 'fixed', 'Use interactive: true and appendTo: document.body; upgrade tippy.'),
  ('AN-FORMIK-001', 'formik', 'Error messages not linked via aria-describedby by default', 'name', 'high', ARRAY['NVDA+Chrome','JAWS+Chrome'], 'Formik ErrorMessage renders adjacent text without wiring aria-describedby on inputs.', 'open', 'Pass aria-describedby from Field meta.error id to the input; use role=alert on errors.'),
  ('AN-RHF-001', 'react-hook-form', 'Manual error spans often missing aria-live', 'live', 'medium', ARRAY['VoiceOver+Safari'], 'Common RHF examples show error text without live regions so SR users miss validation.', 'open', 'Add role=alert or aria-live=polite on error containers and aria-invalid on fields.'),
  ('AN-ZOD-001', 'zod', 'Schema error paths expose field keys not user labels', 'name', 'low', ARRAY['NVDA+Chrome'], 'Raw Zod issue paths mapped to UI without friendly labels confuse screen reader users.', 'open', 'Map issue.path to human-readable labels before announcing errors.')
ON CONFLICT ("an_id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "a11y_package_versions" ("issue_id", "version_range", "fixed_in_version")
SELECT i.id, v.version_range, v.fixed_in_version
FROM (VALUES
  ('AN-CHAKRA-002', '*', NULL),
  ('AN-RADIX-001', '>=1.0.0 <2.1.0', '2.1.0'),
  ('AN-HEADLESS-001', '>=1.7.0 <2.1.0', NULL),
  ('AN-NEXTUI-001', '*', NULL),
  ('AN-TOAST-001', '*', NULL),
  ('AN-SWIPER-001', '>=8.0.0 <11.0.0', NULL),
  ('AN-CHARTJS-001', '*', NULL),
  ('AN-RECHARTS-001', '*', NULL),
  ('AN-TIPPY-001', '>=4.0.0 <4.3.0', '4.3.0'),
  ('AN-FORMIK-001', '*', NULL),
  ('AN-RHF-001', '*', NULL),
  ('AN-ZOD-001', '*', NULL)
) AS v(an_id, version_range, fixed_in_version)
JOIN "a11y_package_issues" i ON i.an_id = v.an_id
WHERE NOT EXISTS (
  SELECT 1 FROM "a11y_package_versions" x WHERE x.issue_id = i.id AND x.version_range = v.version_range
);
