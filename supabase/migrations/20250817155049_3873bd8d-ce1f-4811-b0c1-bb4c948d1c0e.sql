-- Update carousel naming to match CMS system
UPDATE cms_images 
SET carousel_name = 'main_hero' 
WHERE carousel_name = 'home_hero';