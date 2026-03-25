local RESOURCE_NAME = GetCurrentResourceName()

-- ===================================================================
-- 1. SHOW / HIDE COMPONENTS (VisibilityProvider)
-- The boilerplate uses 'set-{ComponentName}-visible' to toggle UI.
-- Or Alternatively, you can use setComponentVisible export for the same effect.
-- ===================================================================
RegisterCommand("ui_show", function()
    -- Enable Focus (cursor and keyboard)
    exports[RESOURCE_NAME]:setFocus(true, true, false)
    
    -- Show our Example component
    exports[RESOURCE_NAME]:setComponentVisible("Example", true)
    
    -- For prompt and others, we might want to also ensure global visibility
    exports[RESOURCE_NAME]:sendMessage("show-nui", true)
end, false)

RegisterCommand("ui_hide", function()
    -- Hide Example component
    exports[RESOURCE_NAME]:setComponentVisible("Example", false)
    
    -- Disable Focus
    exports[RESOURCE_NAME]:setFocus(false, false)
end, false)


-- ===================================================================
-- 1a. GLOBAL UI CONTROL COMMANDS
-- These control all visibility-provider components via built-in events.
-- ui_hide_all: hides every component.
-- ui_show_all: restores all visible components (including manually hidden ones).
-- ui_reset: hides everything and then shows just the components that were auto-enabled.
-- ===================================================================
RegisterCommand("ui_hide_all", function()
    print("Hiding all UI components via hide-nui")
    exports[RESOURCE_NAME]:sendMessage("hide-nui", true)
end, false)

RegisterCommand("ui_show_all", function()
    print("Showing all UI components via show-nui")
    exports[RESOURCE_NAME]:sendMessage("show-nui", true)
end, false)

RegisterCommand("ui_reset", function()
    print("Resetting UI to auto-enabled state: hide everything then restore defaults.")
    exports[RESOURCE_NAME]:sendMessage("reset-ui-state", true)
end, false)


-- ===================================================================
-- 2. SENDING DATA TO REACT (useNuiEvent)
-- Pushing live data into the React state.
-- ===================================================================
RegisterCommand("ui_data", function()
    -- Sends data matching the ExampleProps interface
    exports[RESOURCE_NAME]:sendMessage("example", {
        id = math.random(1000, 9999),
        name = "Hello from FiveM Lua",
        description = "This data was sent directly from a Lua script using exports!"
    })
    print("Sent live data to React UI.")
end, false)


-- ===================================================================
-- 3. USING SOUNDS MANAGER
-- Play 2D/3D sounds pre-configured in SoundConfig
-- ===================================================================
RegisterCommand("ui_sound", function()
    -- Play a 2D sound using the boilerplate audio manager
    exports[RESOURCE_NAME]:sendMessage("play-sound", "csgo_death")
    print("Playing UI Sound...")
end, false)


-- ===================================================================
-- 4. USING THE FADE HANDLER
-- Great for transitions, death screens, or teleporting
-- ===================================================================
RegisterCommand("ui_fade", function()
    print("Fading out to black screen...")
    -- Fade out over 1000ms (1 second)
    exports[RESOURCE_NAME]:sendMessage("fade-in", { duration = 1000 })
    
    -- Wait 3 seconds, then fade back in
    Citizen.SetTimeout(3000, function()
        print("Fading back in...")
        exports[RESOURCE_NAME]:sendMessage("fade-out", { duration = 1000 })
    end)
end, false)


-- ===================================================================
-- 5. ASYNC NUI MESSAGES (Requires UI to return a response)
-- Shows how the Lua script can await data back from React (Prompt component)
-- ===================================================================
RegisterCommand("ui_prompt", function()
    exports[RESOURCE_NAME]:setFocus(true, true)
    exports[RESOURCE_NAME]:sendMessage("show-nui", true) -- Ensure UI is visible globally
    
    Citizen.CreateThread(function()
        print("Waiting for player to submit prompt...")
        
        -- Promise-based NUI call: Script yields here until React responds or times out
        local response, err = exports[RESOURCE_NAME]:sendAsyncMessage("prompt", {
            title = "Lua Async Prompt",
            placeholder = "Type your response...",
            minCharCount = 2,
            maxCharCount = 50,
            timeout = 15000, -- 15 seconds before auto-reject
            defaultValue = ""
        })

        -- Remove focus once they reply or timeout
        exports[RESOURCE_NAME]:setFocus(false, false)

        if err then
            print("Prompt failed or timed out: " .. tostring(err))
        else
            if response ~= nil then
                print("Player typed: " .. tostring(response))
            else
                print("Player pressed ESC and cancelled the prompt.")
            end
        end
    end)
end, false)


-- ===================================================================
-- 6. RECEIVING DATA FROM REACT (fetchNui)
-- Listens for HTTP requests made via fetchNui in React.
-- ===================================================================
-- Example: React calls > fetchNui("get_player_stats")
exports[RESOURCE_NAME]:registerCallback("get_player_stats", function(data)
    -- In React, `data` is the JSON payload sent along with the fetchNui request
    if data then
        print("React requested stats with payload: " .. json.encode(data))
    end
    
    local ped = PlayerPedId()
    
    -- Send response back to the React await fetchNui structure
    return {
        health = GetEntityHealth(ped) - 100,
        armor = GetPedArmour(ped),
        playerId = GetPlayerServerId(PlayerId())
    }
end)

-- Clean up NUI on resource restart just in case
AddEventHandler("onResourceStop", function(res)
    if res == RESOURCE_NAME then
        SetNuiFocus(false, false)
        SetNuiFocusKeepInput(false)
    end
end)

-- ===================================================================
-- 7. ERROR BOUNDARY CALLBACK
-- Listens for error reports from the React error boundary component.
-- ===================================================================

exports[RESOURCE_NAME]:registerCallback("errorBoundary", function(data)
    logError("NUI Error Component: "..(data.component or "unknown"), data.error or "No error message", (data.info and json.encode(data.info) or "No additional info").."\nStack:\n"..(data.stack or "No stack trace"))
end)