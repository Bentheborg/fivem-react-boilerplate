local MAIN_RESOURCE_NAME = "bentheborg-main"

local bHasKeepInput = false
local handlerIdentifiers = {}

local function generateIdentifier()
    local randomId = 0
    while randomId == 0 or handlerIdentifiers[randomId] do
        randomId = math.random(1, 100000) + GetGameTimer()
    end
    return randomId
end

exports("sendMessage", function(action, data)
    SendNUIMessage({
        action = action,
        data = data,
    })
end)

exports("setComponentVisible", function(componentName, isVisible)
    SendNUIMessage({
        action = "set-" .. tostring(componentName) .. "-visible",
        data = isVisible,
    })
end)

exports("sendAsyncMessage", function(action, data)
    local ok, ErrOrPromise = pcall(function()
        local prom = promise.new()
        SendNUIMessage({
            action = action,
            data = data,
        })
        RegisterRawNuiCallback(action .. "_response", function(responseData, callback)
            callback({success = true})
            UnregisterRawNuiCallback(action .. "_response")
            
            local ok, bodyOrErr = pcall(function()
                local body = responseData and responseData.body or nil
                if body and body ~= "" and body ~= "null" then
                    return json.decode(body)
                end
                return nil
            end)

            if not ok then
                print("Error decoding NUI async response for '"..tostring(action).."': "..tostring(bodyOrErr))
                prom:resolve(nil)
            else
                prom:resolve(bodyOrErr)
            end
        end)
        
        local timeout = type(data) == "table" and data.timeout or 65000
        Citizen.SetTimeout(timeout, function()
            UnregisterRawNuiCallback(action .. "_response")
            prom:reject({ error = "timeout" })
        end)
        return Citizen.Await(prom)
    end)
    if not ok then
        if type(ErrOrPromise) == "table" then
            if ErrOrPromise.error and ErrOrPromise.error == "timeout" then
                print("NUI async message for action '"..tostring(action).."' timed out after "..tostring(type(data) == "table" and data.timeout or 65000).." ms ")
                return nil
            end
            ErrOrPromise = json.encode(ErrOrPromise)
        end
        print("Failed to send NUI async message for action '"..tostring(action).."': "..tostring(ErrOrPromise).." "..debug.traceback())
        return nil, "Failed to send NUI async message for action '"..tostring(action).."': "..tostring(ErrOrPromise).." "..debug.traceback()
    end
    return ErrOrPromise
end)

exports("setFocus", function(hasFocus, hasCursor, keepInput)
    SetNuiFocus(hasFocus, hasCursor)
    if type(keepInput) == "boolean" and bHasKeepInput ~= keepInput then
        SetNuiFocusKeepInput(keepInput)
        bHasKeepInput = keepInput
    end
end)

exports("registerCallback", function(name, handler)
    local identifier = generateIdentifier()
    handlerIdentifiers[identifier] = true
    RegisterNUICallback(name, function(data, callback)
        if handlerIdentifiers[identifier] then
            local response = handler(data)
            callback(response or {})
        end
    end)
end)

AddEventHandler("onClientResourceStop", function(resourceName)
    if resourceName == MAIN_RESOURCE_NAME then
        handlerIdentifiers = {}
    end
end)