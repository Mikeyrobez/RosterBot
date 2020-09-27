const Discord = require("discord.js");
const config = require("./config.json");
const Enmap = require('enmap');
/************************************************************
 * ******Feature List***************************************
 * Pull everyone who is in a rank (!roster) - done
 * Do specific things to all people in a rank like DM - done
 * Respond to a ranks post with reactions - sort of done (needs sp channels setup)
 * Attendance on a channel - Done just need to beautify
 * Track events made by apollo - maybe not
 * ping absent guys - done
 * Make teams automatically - pretty much done, maybe future incorporate teams into it?
 * Permissions (guild lead and team leads) - working
 * Add show teams (with flags)
 * Add show team leaders (with flags)
 * standardize format - looks pretty has role specific thumbnails and puts name up top
 * listcommands
 * achievemnts posting/tournament posting
 */


const client = new Discord.Client();
/////////////////enmap and settings/////////////////////////////
client.settings = new Enmap({
    name: "settings",
    fetchAll: false,
    autoFetch: true,
    cloneLevel: 'deep'
});
const defaultSettings = {
    prefix: "!",
    modLogChannel: "mod-log",
    modRole: "Moderator",
    adminRole: "Administrator",
    welcomeChannel: "welcome",
    welcomeMessage: "Say hello to {{user}}, everyone!",
    guildLeaders: [],
    teamLeaders: {},
    teams: [],
    flairChannel: []
}
const prefix = "!";
client.on("guildDelete", guild => {
    // When the bot leaves or is kicked, delete settings to prevent stale entries.
    client.settings.delete(guild.id);
});
////////////////////////////////////////////////////////////////////

////testing when client comes online
client.on('ready', function (message) {
    //console.log(client.guilds);
    //client.settings.delete('757845408373407755'); ////////in case we need to purge during test
});

client.on("message", function (message) {
    if (!message.guild || message.author.bot) return;//if (message.author.bot) return; ///check if author is bot, maybe disable for event creation
    const guildConf = client.settings.ensure(message.guild.id, defaultSettings);
    if (message.content.indexOf(guildConf.prefix) !== 0) return;
    const commandBody = message.content.slice(guildConf.prefix.length);
    const args = commandBody.split(' ');

    const command = args.shift().toLowerCase();
    var messarg = args.join(' ');

    //////////////////////////////////////////////////////////////////
    ///////////////////////Config/////////////////////////////////////
    //////////////////////////////////////////////////////////////////
    // Alright. Let's make a command! This one changes the value of any key
    // in the configuration.
    if (command === "rostersetconf") {
        // Command is admin only, let's grab the admin value: 
        var regExp = /[a-zA-Z]/g;
        if (!regExp.test(messarg)) { message.reply('Please type a setting to change like (!rostersetconf prefix !)'); return; }
        const adminRole = message.guild.roles.cache.find(role => role.name === guildConf.adminRole);
        if (!adminRole) return message.reply("Administrator Role Not Found");

        // Then we'll exit if the user is not admin
        if (!message.member.roles.cache.has(adminRole.id)) {
            return message.reply("You're not an admin, sorry!");
        }


        const [prop, ...value] = args;

        // We can check that the key exists to avoid having multiple useless, 
        // unused keys in the config:
        if (!client.settings.has(message.guild.id, prop)) {
            return message.reply("This key is not in the configuration.");
        }

        // Now we can finally change the value. Here we only have strings for values 
        // so we won't bother trying to make sure it's the right type and such. 
        client.settings.set(message.guild.id, value.join(" "), prop);

        // We can confirm everything's done to the client.
        message.channel.send(`Guild configuration item ${prop} has been changed to:\n\`${value.join(" ")}\``);
    }

    if (command === "rostershowconf") {
        let configProps = Object.keys(guildConf).map(prop => {
            return `${prop}  :  ${guildConf[prop]}`;
        });
        message.channel.send(`The following are the server's current configuration:\`\`\`${configProps.join("\n")}\`\`\``);
    }
    //////not work so well, guess they just have to kick and reinvite
    //if (command === "rosterresetconf") {
    //    const adminRole = message.guild.roles.cache.find(role => role.name === guildConf.adminRole);
    //    if (!adminRole) return message.reply("Administrator Role Not Found");

    //    // Then we'll exit if the user is not admin
    //    if (!message.member.roles.cache.has(adminRole.id)) {
    //        return message.reply("You're not an admin, sorry!");
    //    }
    //    client.settings.delete(message.guild.id);
    //}
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////
    ////////////////Look up roles (!roles)/////////////////////////////
    //////////////////////////////////////////////////////////////////
    if (command === "roles") {
        /////this format works sooooo
        //console.log(message.guild.roles.cache.map(r => r).join(","));
        let rolemap = message.guild.roles.cache
            .sort((a, b) => b.position - a.position)
            .map(r => r)
            .join("\n");
        if (rolemap.length > 1024) rolemap = "Too many roles to display";
        if (!rolemap) rolemap = "No roles";
        //////////////////////////////////////Embed setup///////////////////////////////////////
        let author = message.guild.member(message.author);
        let nickname = author ? author.displayName : null; /////////author nickname
        let guildname = message.guild.name;
        if (rolemap === undefined) { message.reply("Something went wrong, please try again"); return; }
        if (rolemap === null) { message.reply("Something went wrong, please try again"); return; }
        
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${guildname} Teams`)
            .setAuthor(nickname, message.author.displayAvatarURL())
            .setThumbnail(message.guild.iconURL())
            .addField('Role List', rolemap)
            .setTimestamp()
            .setFooter('Created by Roster Bot', 'https://imgur.com/TKZLq41.jpg'); /////change to rosterbot image when I have it
        message.channel.send(embed);
        //const embed = new Discord.MessageEmbed() /////puts the results into a sunk message
        //    .addField("Role List", rolemap)
        //message.channel.send(embed);
        //console.log(message.guild.members.cache); ///////!!!!!!!!!cache is where the data is kept for these things///////////!!!!!!!!!!!


    }

    //////////////////////////////////////////////////////////////////////
    /////////////////Look up roster (!roster)/////////////////////////////
    ///////////////////////////////////////////////////////////////////////
    if (command === "roster") {
        if (messarg === '') {
            let members = message.guild.members.cache
                .sort((a, b) => b.position - a.position)
                .map(r => r)
                .join("\n");
            let membersize = message.guild.memberCount;
            let author = message.guild.member(message.author);
            let nickname = author ? author.displayName : null; /////////author nickname
            let guildname = message.guild.name;
            if (members === undefined) { message.reply("Something went wrong, please try again"); return; }
            if (members === null) { message.reply("Something went wrong, please try again"); return; }
            if (membersize === undefined) { message.reply("Something went wrong, please try again"); return; }
            if (guildname === undefined) { message.reply("Something went wrong, please try again"); return; }

            const embed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setAuthor(nickname, message.author.displayAvatarURL())
                .setThumbnail(message.guild.iconURL())
                .addField(`${guildname} Roster (${membersize} members)`, members)
                .setTimestamp()
                .setFooter('Created by Roster Bot', 'https://imgur.com/TKZLq41.jpg'); /////change to rosterbot image when I have it
            message.channel.send(embed);
            //const embed = new Discord.MessageEmbed() /////puts the results into a sunk message
            //    .addField(`Server Roster (${membersize} members)`, members)
            //message.channel.send(embed);
        }
        if (messarg !== '') {
            if (message.guild.roles.cache.find(role => role.name === messarg) === undefined) { //////catch to exit if not valid role name
                const embed = new Discord.MessageEmbed().addField(`${messarg} is not a valid role`);
                message.channel.send(embed);
                return;
            }
            var roleid = message.guild.roles.cache.find(role => role.name === messarg).id; /////this can find one role ID
            let membersWithRole = message.guild.roles.cache.get(roleid).members.map(username => username).join("\n");////map(x => x) will get a map key object
            let memberswithsize = message.guild.roles.cache.get(roleid).members.size;

            //////////////////////////////////////Embed setup///////////////////////////////////////
            let author = message.guild.member(message.author);
            let nickname = author ? author.displayName : null; /////////author nickname
            let guildname = message.guild.name;
            var emoji = message.guild.emojis.cache.find(emoji => emoji.name === messarg.replace(' ', ''));
            let emojiurl = null;
            if (emoji) { emojiurl = emoji.url; } /////////////team emoji??? 
            if (membersWithRole === undefined) { message.reply("Something went wrong, please try again"); return; }
            if (membersWithRole === null) { message.reply("Something went wrong, please try again"); return; }
            if (memberswithsize === undefined) { message.reply("Something went wrong, please try again"); return; }
            if (messarg === undefined) { message.reply("Something went wrong, please try again"); return; }

            const embed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setAuthor(nickname, message.author.displayAvatarURL())
                .setThumbnail(emojiurl)
                .addField(`${messarg} Roster (${memberswithsize} members)`, membersWithRole)
                .setTimestamp()
                .setFooter('Created by Roster Bot', 'https://imgur.com/TKZLq41.jpg'); /////change to rosterbot image when I have it
            message.channel.send(embed);
        }

    }

    ////////////////////////////////////////////////////////////////////////////////
    /////////////////// Send out orders to role (!order)///////////////////////////
    ////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////needs to function with hierarchy of roles
    if (command === "order") {
        if (messarg === '') {
            const embed = new Discord.MessageEmbed().addField(`Please pick a role to give orders to`);
            message.channel.send(embed);
            return;
        }
        if (messarg !== '') {
            if (message.guild.roles.cache.find(role => role.name === messarg) === undefined) { //////catch to exit if not valid role name
                const embed = new Discord.MessageEmbed().addField(`${messarg} is not a valid role`);
                message.channel.send(embed);
                return;
            }

            //////////check to see if team leader first
            var teamLeaders = client.settings.get(message.guild.id, 'teamLeaders');
            var userid = message.member.id;
            var roleid = message.guild.roles.cache.find(role => role.name === messarg).id;
            if (teamLeaders[roleid] === undefined) { message.reply(`There is no team leader for ${messarg}`); return; }
            if (teamLeaders[roleid].indexOf(userid) == -1) { message.reply(`You must be a team leader for ${givearg[0]}`); return; }

            //var roleid = message.guild.roles.cache.find(role => role.name === messarg).id;
            const ordersmembers = message.guild.roles.cache.get(roleid).members.map(id => id).join(",");
            var members = ordersmembers.split(",");

            let author = message.guild.member(message.author);
            let nickname = author ? author.displayName : null; /////////author nickname
            let guildname = message.guild.name;

            ///////////////Sends a message then waits for reply, when it has reply it sends to all members of role
            message.author.send('What are your orders?')
                .then(function () {
                    message.author.dmChannel.awaitMessages(response => message.content, {
                        max: 1,
                        time: 60000,
                        errors: ['time'],
                    })
                        .then((collected) => {
                            for (var x = 0; x < members.length; x++) {
                                var id = members[x].replace("@", "").replace("<", "").replace(">", "").replace(/!/g, "");
                                client.users.cache.get(id).send(`${nickname} from ${guildname} sent you the following orders: ${collected.first().content}`);
                            }
                            message.author.send(`Your orders were sent`);

                        })
                        .catch(function () {
                            message.author.send('Timed out or orders failed to send');
                        });
                });
            ///////////////it just works
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    ///////////////////////Attendance (!attendance)////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////
    ////We will have to provide a list of names (role?) and compare to a list of people in a voice lobby
    if (command === "attendance") {

        let givearg = messarg.split('=>');

        /////errors///////////////////////////////////////////////////////////////////////////////////////////
        if (givearg.length < 2) { message.reply('Please enter a role and voice lobby (role=>voicelobby)'); return; }
        if (message.guild.roles.cache.find(role => role.name === givearg[0]) === undefined) { message.reply(`There is no role called "${givearg[0]}" (role=>voicelobby)`); return; }
        if (message.guild.channels.cache.find(channel => channel.name === givearg[1]) === undefined) { message.reply(`There is no channel called "${givearg[1]}" (role=>voicelobby)`); return; }

        //////////check to see if team leader first
        var teamLeaders = client.settings.get(message.guild.id, 'teamLeaders');
        var userid = message.member.id;
        var roleid = message.guild.roles.cache.find(role => role.name === givearg[0]).id;
        if (teamLeaders[roleid] === undefined) { message.reply(`There is no team leader for ${givearg[0]}`); return; }
        if (teamLeaders[roleid].indexOf(userid) == -1) { message.reply(`You must be a team leader for ${givearg[0]}`); return; }


        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        const rolemembers = message.guild.roles.cache.get(roleid).members.map(id => id).join(",");
        var allmembers = rolemembers.replace(/</g, "").replace(/>/g, "").replace(/@/g, "").replace(/!/g, "").split(",");


        var voicechannel = message.guild.channels.cache.find(channel => channel.name === givearg[1]).id;


        var voicemembers = message.guild.channels.cache.get(voicechannel).members.map(id => id).join(",");
        var attending = voicemembers.replace(/</g, "").replace(/>/g, "").replace(/@/g, "").replace(/!/g, "").split(",");
        //console.log(allmembers, attending);
        var present = allmembers.filter(value => attending.indexOf(value) > -1);
        var absent = allmembers.filter(value => attending.indexOf(value) == -1);//!attending.includes(value));
        //console.log(present, absent);
        var presentnames = message.guild.members.cache.filter(members => present.indexOf(members.id) > -1).map(member => member.displayName).join("\n");//members.id.indexOf(present) > -1).map(username => username).join("\n");
        var absentnames = message.guild.members.cache.filter(members => absent.indexOf(members.id) > -1).map(member => member.displayName).join("\n");
        var presentsize = message.guild.members.cache.filter(members => present.indexOf(members.id) > -1).size;
        var absentsize = message.guild.members.cache.filter(members => absent.indexOf(members.id) > -1).size; ///////doing not present vs absent
        //console.log(presentnames, absentnames)

        if (present.length == 0) { presentnames = 'none'; presentsize = 0; }
        if (absent.length == 0) { absentnames = 'none'; absentsize = 0; }

        //////////////////////////////////////Embed setup///////////////////////////////////////
        let author = message.guild.member(message.author);
        let nickname = author ? author.displayName : null; /////////author nickname
        let guildname = message.guild.name;
        var emoji = message.guild.emojis.cache.find(emoji => emoji.name === givearg[0].replace(' ', ''));
        let emojiurl = null;
        if (emoji) { emojiurl = emoji.url; } /////////////team emoji??? 
        var d = new Date();
        if (givearg[1] === undefined) { message.reply("Something went wrong, please try again"); return; }
        if (presentnames === undefined) { message.reply("Something went wrong, please try again"); return; }
        if (absentnames === undefined) { message.reply("Something went wrong, please try again"); return; }
        if (givearg[1] === null) { message.reply("Something went wrong, please try again"); return; }
        if (presentnames === null) { message.reply("Something went wrong, please try again"); return; }
        if (absentnames === null) { message.reply("Something went wrong, please try again"); return; }
        if (presentsize === undefined) { message.reply("Something went wrong, please try again"); return; }
        if (absentsize === undefined) { message.reply("Something went wrong, please try again"); return; }
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${givearg[0]} Attendance`)
            .setDescription(`${d}`)
            .setAuthor(nickname, message.author.displayAvatarURL())
            .setThumbnail(emojiurl)
            .addField('Voice Lobby', givearg[1])
            .addField(`${presentsize} attending`, presentnames)
            .addField(`${absentsize} missing`, absentnames)
            .setTimestamp()
            .setFooter('Created by Roster Bot', 'https://i.imgur.com/TKZLq41.jpg'); /////change to rosterbot image when I have it
        message.channel.send(embed);
        //const embed = new Discord.MessageEmbed()
        //    .addField(`${presentsize} attending`, presentnames)
        //    .addField(`${absentsize} missing`, absentnames)
        //message.channel.send(embed);

    }

    ///////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////Warn Absent/////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////
    ////This will essentialy be a combo of attendance and orders
    if (command === "warnabsent") {

        let givearg = messarg.split('=>');

        /////errors///////////////////////////////////////////////////////////////////////////////////////////
        if (givearg.length < 2) { message.reply('Please enter a role and voice lobby (role=>voicelobby)'); return; }
        if (message.guild.roles.cache.find(role => role.name === givearg[0]) === undefined) { message.reply(`There is no role called "${givearg[0]}" (role=>voicelobby)`); return; }
        if (message.guild.channels.cache.find(channel => channel.name === givearg[1]) === undefined) { message.reply(`There is no channel called "${givearg[1]}" (role=>voicelobby)`); return; }

        //////////check to see if team leader first
        var teamLeaders = client.settings.get(message.guild.id, 'teamLeaders');
        var userid = message.member.id;
        var roleid = message.guild.roles.cache.find(role => role.name === givearg[0]).id;
        if (teamLeaders[roleid] === undefined) { message.reply(`There is no team leader for ${givearg[0]}`); return; }
        if (teamLeaders[roleid].indexOf(userid) == -1) { message.reply(`You must be a team leader for ${givearg[0]}`); return; }

        //var roleid = message.guild.roles.cache.find(role => role.name === givearg[0]).id;
        const rolemembers = message.guild.roles.cache.get(roleid).members.map(id => id).join(",");
        var allmembers = rolemembers.replace(/</g, "").replace(/>/g, "").replace(/@/g, "").replace(/!/g, "").split(",");
        var voicechannel = message.guild.channels.cache.find(channel => channel.name === givearg[1]).id;
        var voicemembers = message.guild.channels.cache.get(voicechannel).members.map(id => id).join(",");
        var attending = voicemembers.replace(/</g, "").replace(/>/g, "").replace(/@/g, "").replace(/!/g, "").split(",");
        var absent = allmembers.filter(value => attending.indexOf(value) == -1);//!attending.includes(value));

        if (absent.length === 0 | absent === undefined) { message.reply('No team members absent'); return; }
        var absentnames = message.guild.members.cache.filter(members => absent.indexOf(members.id) > -1).map(member => member.displayName).join("\n");
        if (absentnames === undefined) { message.reply("Something went wrong, please try again"); return; }
        const absentembed = new Discord.MessageEmbed()
            .addField(`The following team members are absent`, absentnames)
            .addField('Send Warning?', 'Type in the name of the event they are absent for')
        let author = message.guild.member(message.author);
        let nickname = author ? author.displayName : null; /////////author nickname
        let guildname = message.guild.name;

        ///////////////Sends a message then waits for reply, when it has reply it sends to all members of role
        message.author.send(absentembed)
            .then(function () {
                message.author.dmChannel.awaitMessages(response => message.content, {
                    max: 1,
                    time: 60000,
                    errors: ['time'],
                })
                    .then((collected) => {
                        for (var x = 0; x < absent.length; x++) {
                            var id = absent[x];
                            client.users.cache.get(id).send(`${nickname} from ${guildname} sent you a warning: you are late or absent for ${collected.first().content}`);
                        }
                        message.author.send(`Your warning was sent`);

                    })
                    .catch(function () {
                        message.author.send('Timed out or warning failed to send');
                    });
            });

    }

    /////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////Add channel to post flair on (!addflairchannel)///////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////
    if (command === "addflairchannel") {
        var guildLeaders = client.settings.get(message.guild.id, 'guildLeaders');
        var userid = message.member.id;
        if (guildLeaders.indexOf(userid) == -1) { message.reply('You must be a guild leader'); return; }
        if (message.guild.channels.cache.find(channel => channel.name === messarg) === undefined) { message.reply(`${messarg} is not a valid channel`); return; }
        let channelid = message.guild.channels.cache.find(channel => channel.name === messarg).id;
        var temp = client.settings.get(message.guild.id, 'flairChannel');
        if (temp.indexOf(channelid) > -1) { message.reply(`${messarg} is already a flair channel`); return; }
        temp.push(channelid);
        client.settings.set(message.guild.id, "flairChannel", temp);
        message.reply(`added ${messarg} as flair channel`);

    }

    if (command === "removeflairchannel") {
        var guildLeaders = client.settings.get(message.guild.id, 'guildLeaders');
        var userid = message.member.id;
        if (guildLeaders.indexOf(userid) == -1) { message.reply('You must be a guild leader'); return; }
        if (message.guild.channels.cache.find(channel => channel.name === messarg) === undefined) { message.reply(`${messarg} is not a valid channel`); return; }
        let channelid = message.guild.channels.cache.find(channel => channel.name === messarg).id;
        var temp = client.settings.get(message.guild.id, 'flairChannel');
        if (temp.indexOf(channelid) == -1) { message.reply(`${messarg} is not a flair channel`); return; }
        for (var x = 0; x < temp.length; x++) {
            if (temp[x] === channelid) {
                temp.splice(x, 1);
                break;
            }
        }
        client.settings.set(message.guild.id, "flairChannel", temp);
        message.reply(`removed ${messarg} as flair channel`);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////Add guild/team leader////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    if (command === "addguildleader") {
        const adminRole = message.guild.roles.cache.find(role => role.name === guildConf.adminRole);
        if (!adminRole) return message.reply("Administrator Role Not Found");
        // Then we'll exit if the user is not admin
        if (!message.member.roles.cache.has(adminRole.id)) {
            return message.reply("You're not an admin, sorry!");
        }

        var temp = client.settings.get(message.guild.id, 'guildLeaders');
        var addid = message.mentions.users.first().id;
        ///////check if already exists
        if (temp.indexOf(addid) > -1) { message.reply(`${message.mentions.users.first().username} is already a guildleader`); return; }
        temp.push(addid);
        client.settings.set(message.guild.id, "guildLeaders", temp);
        message.reply(`added ${messarg} to guildleader`);
    }

    if (command === "removeguildleader") {
        const adminRole = message.guild.roles.cache.find(role => role.name === guildConf.adminRole);
        if (!adminRole) return message.reply("Administrator Role Not Found");
        // Then we'll exit if the user is not admin
        if (!message.member.roles.cache.has(adminRole.id)) {
            return message.reply("You're not an admin, sorry!");
        }

        var temp = client.settings.get(message.guild.id, 'guildLeaders');
        var addid = message.mentions.users.first().id;
        ///////check if already exists
        if (temp.indexOf(addid) == -1) { message.reply(`${message.mentions.users.first().username} is not a guildleader`); return; }
        for (var x = 0; x < temp.length; x++) {
            if (temp[x] === addid) {
                temp.splice(x, 1);
                break;
            }
        }
        client.settings.set(message.guild.id, "guildLeaders", temp);
        message.reply(`removed ${messarg} from guildleader`);
    }

    if (command === "addteamleader") {
        var guildLeaders = client.settings.get(message.guild.id, 'guildLeaders');
        var userid = message.member.id;
        if (guildLeaders.indexOf(userid) == -1) { message.reply('You must be a guild leader'); return; }


        var teamLeaders = client.settings.get(message.guild.id, 'teamLeaders');
        let givearg = messarg.split('=>');
        var addid = message.mentions.users.first().id;

        if (message.guild.roles.cache.find(role => role.name === givearg[1]) === undefined) { message.reply('Please enter a valid team name'); return; }
        let roleid = message.guild.roles.cache.find(role => role.name === givearg[1]).id;

        if (teamLeaders[roleid] === undefined) { teamLeaders[roleid] = [addid]; } else {
            if (teamLeaders[roleid].indexOf(addid) > -1) { message.reply(`${message.mentions.users.first().username} is already a teamleader for ${givearg[1]}`); return; }
            teamLeaders[roleid].push(addid);
        }
        client.settings.set(message.guild.id, "teamLeaders", teamLeaders);
        message.reply(`added ${givearg[0]} to ${givearg[1]} team leader`);
    }

    if (command === "removeteamleader") {
        var guildLeaders = client.settings.get(message.guild.id, 'guildLeaders');
        var userid = message.member.id;
        if (guildLeaders.indexOf(userid) == -1) { message.reply('You must be a guild leader'); return; }


        var teamLeaders = client.settings.get(message.guild.id, 'teamLeaders');
        let givearg = messarg.split('=>');
        var addid = message.mentions.users.first().id;

        if (message.guild.roles.cache.find(role => role.name === givearg[1]) === undefined) { message.reply('Please enter a valid team name'); return; }
        let roleid = message.guild.roles.cache.find(role => role.name === givearg[1]).id;

        if (teamLeaders[roleid] === undefined) { message.reply(`There are no team leaders for ${givearg[1]}`); return; } else {
            if (teamLeaders[roleid].indexOf(addid) == -1) { message.reply(`${message.mentions.users.first().username} is not a teamleader for ${givearg[1]}`); return; }
            //teamLeaders[roleid].push(addid);
            teamLeaders[roleid] = teamLeaders[roleid].filter(el => el !== addid);
        }
        client.settings.set(message.guild.id, "teamLeaders", teamLeaders);
        message.reply(`removed ${givearg[0]} from ${givearg[1]} team leader`);

    }

    /////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////add remove or List all teams (!addteams ! removeteams !listteams)/////////
    //////////////////////////////////////////////////////////////////////////////////////////////////
    /////////right now this will only be for viewing teams and team leads but in the future it may restrict roles to only those that are teams
    /////////or be used in scheduling/team creation
    ////////we want to make an embed with the custom role emoji on each level
    ///////We should loop through the roles, removing ones that aren't teams
    if (command === "addteam") {
        const adminRole = message.guild.roles.cache.find(role => role.name === guildConf.adminRole);
        if (!adminRole) return message.reply("Administrator Role Not Found");
        // Then we'll exit if the user is not admin
        if (!message.member.roles.cache.has(adminRole.id)) {
            return message.reply("You're not an admin, sorry!");
        }

        if (message.guild.roles.cache.find(role => role.name === messarg) === undefined) { message.reply('Please enter an existing server role for a team name'); return; }
        var roleid = message.guild.roles.cache.find(role => role.name === messarg).id;
        var teams = client.settings.get(message.guild.id, 'teams');
        if (teams.indexOf(roleid) > -1) { message.reply(`${messarg} is already a team`); return; }
        teams.push(roleid);
        client.settings.set(message.guild.id, "teams", teams);
        message.reply(`added ${messarg} to teams`);
    }

    if (command === "removeteam") {
        const adminRole = message.guild.roles.cache.find(role => role.name === guildConf.adminRole);
        if (!adminRole) return message.reply("Administrator Role Not Found");
        // Then we'll exit if the user is not admin
        if (!message.member.roles.cache.has(adminRole.id)) {
            return message.reply("You're not an admin, sorry!");
        }

        if (message.guild.roles.cache.find(role => role.name === messarg) === undefined) { message.reply('Please enter an existing server role for a team name'); return; }
        var roleid = message.guild.roles.cache.find(role => role.name === messarg).id;
        var teams = client.settings.get(message.guild.id, 'teams');
        if (teams.indexOf(roleid) == -1) { message.reply(`${messarg} is not a team`); return; }
        for (var x = 0; x < teams.length; x++) {
            if (teams[x] === roleid) {
                teams.splice(x, 1);
                break;
            }
        }
        client.settings.set(message.guild.id, "teams", teams);
        message.reply(`removed ${messarg} from teams`);
    }

    if (command === "listteams") {
        var teams = client.settings.get(message.guild.id, 'teams');
        if (teams.length < 1) { message.reply("There are no teams"); return }
        var teamstrings = [];
        for (var x = 0; x < teams.length; x++) {
            var rolename = message.guild.roles.cache.get(teams[x]).name;
            let emoji = message.guild.emojis.cache.find(emoji => emoji.name == rolename.replace(' ', ''));
            if (emoji === undefined) { emoji = ''; }
            teamstrings.push(`${rolename} ${emoji}`);
        }
        let author = message.guild.member(message.author);
        let nickname = author ? author.displayName : null; /////////author nickname
        let guildname = message.guild.name;
        if (teamstrings === undefined) { message.reply("Something went wrong, please try again"); return; }
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Team list for ${guildname}`)
            .setAuthor(nickname, message.author.displayAvatarURL())
            .setThumbnail(message.guild.iconURL())
            .addField('Teams', teamstrings.join('\n'))
            .setTimestamp()
            .setFooter('Created by Roster Bot', 'https://imgur.com/TKZLq41.jpg'); /////change to rosterbot image when I have it
        message.channel.send(embed);
    }

    if (command === "listteamleaders") {
        var teamLeaders = client.settings.get(message.guild.id, 'teamLeaders');
        var keya = Object.keys(teamLeaders);
        if (keya.length < 1) { message.reply("There are no team leaders"); return }
        var temp = [];
        var strings = [];
        var user, rolename, emoji;
        for (var i = 0; i < keya.length; i++) {
            rolename = message.guild.roles.cache.get(keya[i]).name;
            emoji = message.guild.emojis.cache.find(emoji => emoji.name == rolename.replace(' ', ''));
            if (emoji === undefined) { emoji = ''; }

            strings.push(`**${rolename}** ${emoji}`);
            temp = teamLeaders[keya[i]];
            for (var x = 0; x < temp.length; x++) {
                user = message.guild.members.cache.get(temp[x]).user.username;
                strings.push(user);
            }
        }
        console.log(strings);
        let author = message.guild.member(message.author);
        let nickname = author ? author.displayName : null; /////////author nickname
        let guildname = message.guild.name;
        if (strings === undefined) { message.reply("Something went wrong, please try again"); return; }

        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Team leader list for ${guildname}`)
            .setAuthor(nickname, message.author.displayAvatarURL())
            .setThumbnail(message.guild.iconURL())
            .addField('Team Leaders', strings.join('\n'))
            .setTimestamp()
            .setFooter('Created by Roster Bot', 'https://imgur.com/TKZLq41.jpg'); /////change to rosterbot image when I have it
        message.channel.send(embed);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////Make teams (splitteams)//////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////
    if (command === "splitteams") {
        var guildLeaders = client.settings.get(message.guild.id, 'guildLeaders');
        var userid = message.member.id;
        if (guildLeaders.indexOf(userid) == -1) { message.reply('You must be a guild leader'); return; }

        //console.log(message.guild.members);
        var voicechannel = message.guild.channels.cache.find(channel => channel.name === messarg).id;
        var voicemembers = message.guild.channels.cache.get(voicechannel).members.map(id => id).join(",");
        var attending = voicemembers.replace(/</g, "").replace(/>/g, "").replace(/@/g, "").replace(/!/g, "").split(",");
        //var attending = ['125003475376537600', '125003475376537600', '125003475376537600', '588946848006275092', '588946848006275092', '588946848006275092', '588946848006275092', '757844308270252093', '757844308270252093']
        //var attending = ['1', '2', '3', '4', '5']; ///////test attending
        if (attending.length < 2) { message.reply(`There is not enough members in ${messarg} to make teams`); return; }
        ////////////make the json array
        //////////////////////////////////////////////////////
        /////////Add a function to loop through roles and and make a group object for emojis that can be attached at the end
        var groups = {}, emojigroups = {},roles,rolenames;
        for (var i = 0; i < attending.length;i++) {
            roles = message.guild.members.cache.get(attending[i]).roles.cache.map(id => id).join(':');
            if (groups[roles] === undefined) { groups[roles] = [attending[i]]; } else { groups[roles].push(attending[i]); }
        }
        //groups = { '1': ['125003475376537600', '125003475376537600', '125003475376537600'], 2: ['588946848006275092', '588946848006275092', '588946848006275092', '588946848006275092'] };
        //groups = { '1': ['1', '3', '4'], 2: ['2','7','9'], 3: ['5','6'], 4: ['8'] };
        ///////////get sizes array
        var keys = Object.keys(groups);
        var length, groupsizes = {},sum = 0;
        for (var i = 0; i < keys.length; i++) {
            length = groups[keys[i]].length;
            sum += length;
            if (groupsizes[keys[i]] === undefined) { groupsizes[keys[i]] = [length]; } else { groupsizes[keys[i]].push(length); } 
        }
        //console.log(groupsizes);
        ///////////Now loop through all combinationns of sizes and save the combo of keys that have the lowest difference to the total sum/2
        var min = sum,keycombo,keyacc,addlength,total;
        for (let i = 0; i < keys.length - 1; i++) {
            keyacc = [keys[i]];
            total = parseInt(groupsizes[keys[i]]);
            for (let j = i + 1; j < keys.length; j++) {
                keyacc.push(keys[j]);
                total = total + parseInt(groupsizes[keys[j]]);
                addlength = Math.abs(total - (sum / 2));
                if ( addlength < min) {
                    keycombo = keyacc;
                    min = addlength;
                }
            }
        }
        
        /////////keycombo should be the combination of keys that we need now we split the teams
        var notkeycombo = keys.filter(value => keycombo.indexOf(value) == -1);
        var team1 = [], team2 = [];
        for (var i = 0; i < keycombo.length; i++) {
            team1 = team1.concat(groups[keycombo[i]]);
        }
        for (var i = 0; i < notkeycombo.length; i++) {
            team2 = team2.concat(groups[notkeycombo[i]]);
        }
        ///////if teams are uneven by 2 or more, we have to balance them by switching the last members
        var move;
        if (Math.abs(team1.length - team2.length >= 2)) {
            var diff = Math.floor(Math.abs(team1.length - team2.length) / 2);
            if (team1.length > team2.length) {
                move = team1.splice(team1.length - diff, diff);
                team2 = team2.concat(move);
            } else {
                move = team2.splice(team2.length - diff, diff);
                team1 = team1.concat(move);
            }
            
        }
        /////Now put the id's back into embeds
        var team1names = message.guild.members.cache.filter(members => team1.indexOf(members.id) > -1).map(member => member.displayName).join("\n");//members.id.indexOf(present) > -1).map(username => username).join("\n");
        var team2names = message.guild.members.cache.filter(members => team2.indexOf(members.id) > -1).map(member => member.displayName).join("\n");
        //////if by teams maybe we could get the team name and attach team emoji of each but right now we just leave it like this

        let author = message.guild.member(message.author);
        let nickname = author ? author.displayName : null; /////////author nickname
        let guildname = message.guild.name;
        var d = new Date();
        if (team1names === undefined) { message.reply("Something went wrong, please try again"); return; }
        if (team2names === undefined) { message.reply("Something went wrong, please try again"); return; }
        if (team1names === null) { message.reply("Something went wrong, please try again"); return; }
        if (team2names === null) { message.reply("Something went wrong, please try again"); return; }

        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${messarg} Teams`)
            .setDescription(`${d}`)
            .setAuthor(nickname, message.author.displayAvatarURL())
            .setThumbnail(message.guild.iconURL())
            .addField(`Team 1 (${team1.length})`, team1names)
            .addField(`Team 2 (${team2.length})`, team2names)
            .setTimestamp()
            .setFooter('Created by Roster Bot', 'https://imgur.com/TKZLq41.jpg'); /////change to rosterbot image when I have it
        message.channel.send(embed);

    }

    if (command === "splitteamsrandom") {
        var guildLeaders = client.settings.get(message.guild.id, 'guildLeaders');
        var userid = message.member.id;
        if (guildLeaders.indexOf(userid) == -1) { message.reply('You must be a guild leader'); return; }

        var voicechannel = message.guild.channels.cache.find(channel => channel.name === messarg).id;
        var voicemembers = message.guild.channels.cache.get(voicechannel).members.map(id => id).join(",");
        var attending = voicemembers.replace(/</g, "").replace(/>/g, "").replace(/@/g, "").replace(/!/g, "").split(",");
        //var attending = ['125003475376537600', '125003475376537600', '125003475376537600', '588946848006275092', '588946848006275092', '588946848006275092', '588946848006275092', '757844308270252093', '757844308270252093']
        //var attending = ['1', '2', '3', '4', '5']; ///////test attending
        if (attending.length < 2) { message.reply(`There is not enough members in ${messarg} to make teams`); return; }
        var team1 = [], team2 = [];
        for (var i = 0; i < attending.length; i++) {
            if (i % 2 == 0) { team1.push(attending[i]); } else { team2.push(attending[i]); }
        }
        /////Now put the id's back into embeds
        var team1names = message.guild.members.cache.filter(members => team1.indexOf(members.id) > -1).map(member => member.displayName).join("\n");//members.id.indexOf(present) > -1).map(username => username).join("\n");
        var team2names = message.guild.members.cache.filter(members => team2.indexOf(members.id) > -1).map(member => member.displayName).join("\n");
        //////if by teams maybe we could get the team name and attach team emoji of each but right now we just leave it like this

        let author = message.guild.member(message.author);
        let nickname = author ? author.displayName : null; /////////author nickname
        let guildname = message.guild.name;
        var d = new Date();
        if (team1names === undefined) { message.reply("Something went wrong, please try again"); return; }
        if (team2names === undefined) { message.reply("Something went wrong, please try again"); return; }
        if (team1names === undefined) { message.reply("Something went wrong, please try again"); return; }
        if (team2names === undefined) { message.reply("Something went wrong, please try again"); return; }
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${messarg} Teams`)
            .setDescription(`${d}`)
            .setAuthor(nickname, message.author.displayAvatarURL())
            .setThumbnail(message.guild.iconURL())
            .addField(`Team 1 (${team1.length})`, team1names)
            .addField(`Team 2 (${team2.length})`, team2names)
            .setTimestamp()
            .setFooter('Created by Roster Bot', 'https://imgur.com/TKZLq41.jpg'); /////change to rosterbot image when I have it
        message.channel.send(embed);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////List all commands (!rosterlistcommands)///////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////
    if (command === "rosterlistcommands") {
        //////////////use an embed to list commands
        let author = message.guild.member(message.author);
        let nickname = author ? author.displayName : null; /////////author nickname
        let guildname = message.guild.name;
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Roster Bot Commands`)
            .setAuthor(nickname, message.author.displayAvatarURL())
            .setThumbnail(message.guild.iconURL())
            .addField("!rostersetconf", "Change a config setting (use: '!rostersetconf prefix !')")
            .addField("!rostershowconf", "Show current config settings")
            .addField("!addguildleader/!removeguildleader (Administrator required)", "Add/Remove a guildleader (use: !addguildleader @member)")
            .addField("!addteamleader/!removeteamleader (guildleader required)", "Add/Remove a teamleader (use: !addteamleader @member=>role)")
            .addField("!addflairchannel/!removeflairchannel (guildleader required)", "Add/Remove a flairchannel (use: !addguildleader channel)")
            .addField("!roles", "Get a list of roles")
            .addField("!roster", "Get a list of team members (use: '!roster <role>')")
            .addField("!order (teamleader required)", "Send orders to team members (use: '!order <role>')")
            .addField("!attendance(teamleader required)", "Get attendance record of team members in a voice channel (use: '!attendance role=>channel')")
            .addField("!warnabsent(teamleader required)", "Send a warning to all absent team members (use: '!warnabsent role=>channel')")
            .addField("!addteam/removeteam (Administator required)", "Add a team to the team list")
            .addField("!listteams", "List all teams that are in team list")
            .addField("!listteamleaders", "Lists all the leaders of each team")
            .addField("!splitteams (guildleader required)", "Splits the members of a voice lobby into 2 teams based on shared roles")
            .addField("!splitteamsrandom (guildleader required)", "Splits the members of a voice lobby into 2 teams randomly")
            .setTimestamp()
            .setFooter('Created by Roster Bot', 'https://imgur.com/TKZLq41.jpg'); /////change to rosterbot image when I have it
        message.channel.send(embed);
    }

});           

////////////////////For functions that run checks on every message
client.on("message", function (message) {
    ///////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////React to messages with emojis on certain channels//////////
    ////////////////////////////////////////////////////////////////////////////////////////
    ///We want to make it so that it only works in a flair channel so we will get the message ID
    //console.log(message.channel.name);
    if (message.guild === null) { return; } 
    let flairChannels = client.settings.get(message.guild.id, "flairChannel");
    //if (message.channel.name === 'flair-channel') { ////////will need to be able to save a list of channels that flair is allowed on
    if (flairChannels.indexOf(message.channel.id) > -1) { 
        const rolelist = message.member.roles.cache.map(name => name).join(",");
        var userroles = rolelist.split(",");
        //console.log(rolelist);
        for (var x = 0; x < userroles.length; x++) {
            var roleid = userroles[x].replace("&", "").replace("<", "").replace(">", "").replace("@", "").replace(/!/g, "");
            if (message.guild.roles.cache.get(roleid) === undefined) { continue; }
            var name = message.guild.roles.cache.get(roleid).name;
            var emoji = message.guild.emojis.cache.find(emoji => emoji.name === name.replace(' ', ''));
            if (emoji === undefined) { continue; }
            message.react(emoji.id);
        }
        //const emoji = message.guild.emojis.cache.find(emoji => emoji.name === "Testrole");
        //message.react(emoji.id);
    }
});

client.login(config.BOT_TOKEN);

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('ok');
});
server.listen(3000);