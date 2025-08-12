-- Manually link the most recent push subscription to the user neil@cityandsanctuary.com
UPDATE push_subscriptions 
SET user_id = 'd3da6974-b49c-4e24-a649-5690ff0c1bca', 
    last_seen = now() 
WHERE id = '54caa0b0-16ba-4633-af5a-185ff42af0d1';